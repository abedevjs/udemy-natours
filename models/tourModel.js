//di file js yg ini tempat dimana bnyak class,parent mongoose di bentuk
//keep fat models, thin controllers
const mongoose = require('mongoose');
const slugify = require('slugify');//slug is basically just a name that we put in the url
const User = require('./userModel');

const tourSchema = new mongoose.Schema({//1st argument:  object for Schemea definition. 2nd argument:  object for options
    name: {
        type: String,
        required: [true, 'A tour must have a name'],
        unique: true,
        trim: true, //only works for string. Removes the white space in the beginning and the end of a string
        maxlength: [40, 'A tour name must have less or equal than 40 characters'],
        minlength: [10, 'A tour name must have more or equal than 10 characters']
    },
    slug: String,
    duration: {
        type: Number,
        required: [true, 'A tour must have a duration']
    },
    maxGroupSize: {
        type: Number,
        required: [true, 'A tour must have a group size']
    },
    difficulty: {
        type: String,
        required: [true, 'A tour must have a difficulty'],
        enum: {//this is only for string
            values: ['easy', 'medium', 'difficult'],
            message: 'A difficulty must either be: easy, medium, difficult'
        }
    },
    ratingsAverage: {
        type: Number,
        default: 4.5,
        min: [1, 'Rating must be above than 1.0'],//this min-max not only works for number but also for dates
        max: [5, 'Rating must be less than 5.0'],
        set: value => Math.round(value * 10) / 10//this Set will run each time a new value is set for this field
            //Klo math.round aja itu convert to integers, contoh 4.666 = 5
            //Jadi ditambahi * 10, contoh 4.66666 * 10 = 46.666 di round menjadi 47
            //Terus dibagi / 10, contoh 47 = 4.7
    },
    ratingsQuantity: {
        type: Number,
        default: 0
    },
    price: {
        type: Number,
        required: [true, 'A tour must have a price']
    },
    priceDiscount: {
        type: Number,
        validate: {
            validator: function(value) {//the validator only works for creating a new document, not updating
                return value < this.price;//this keyword refers to this document
            },
            message: 'Discount price ({VALUE}) should be below regular price'//({VALUE}) is a mongoose thing
        }
    },
    summary: {
        type: String,
        trim: true, //only works for string. Removes the white space in the beginning and the end of a string
        required: [true, 'A tour must have a description']
    },
    description: {
        type: String,
        trim: true
    },
    imageCover: {
        type: String,//this basically the name of the image which later then will be read from the file system
            //or as a reference restored in database
        required: [true, 'A tour must have a cover image']
    },
    images: [String],
    createdAt: {
        type: Date,
        default: Date.now(),
        select: false
    },
    startDates: [Date],
    secretTour: {
        type: Boolean,
        default: false
    },
    startLocation: {//in order to create geospatial data in mongodb, we to create an object which inside will have two fields. type and coordinates
        //Geo Spatial. Geo JSON
        type: {
            type: String,
            default: 'Point',//bisa polygons, lines or other geometries,
            enum: ['Point']
        },
        coordinates: [Number],//means we expect an array of numbers.Longitude first and Latitude. Ex: [-80.185942, 25.774772]
        address: String,
        description: String
    },
    locations: [//THIS IS EMBEDDED DOCUMENT
        //In order to create an embedded document(child) inside of (parent) document, you need to create an array inside the object(parent document)
        //This automatically will also have an id
        {
            type: {
                type: String,
                default: 'Point',
                enum: ['Point']
            },
            coordinates: [Number],
            address: String,
            description: String,
            day: Number
        }
    ],
    guides: [//This here is Referencing. Guides and Tour are separate entity. But when we access Tour, we can also have access to the Tour Guides of this spesific tour
        //But to use this embedded, we need to define query middleware with pre.find code which has written below
        //Ini jg disebut child referencing

        {
            type: mongoose.Schema.ObjectId,
            ref: 'User'//ini User model, tanpa harus kita define const User = require('./userModel'); diatas. Model dalam mongoose sdh terkoneksi
        }
    ]
    //guides: Array//This here is Embedding
        //This array here is also an embedded guides document of this tour document
        //But to use this embedded, we need to define a document middleware pre save code which has written below
        //tourSchema.pre('save', async function(next) {//This code is responsible for Embedding/Denormalize Guides to Tour

}, {//2nd argument:  object for options
    toJSON: { virtuals: true },//Virtual Properties= Fields that we can define in our schema but it will not be persisted
    toObject: { virtuals: true }
});

tourSchema.index({ price: 1, ratingsAverage: -1 });//Index ini utk agar pas user search keyword price, mongoDB ga perlu liat seluruh document satu per satu
    //dengan index(), mongoDB cukup liat document yg sesuai dgn value search keyword yg di cari
    //1= Ascending, -1= Descnding
    //klo dlm objek diatas, lbh dari satu keyword, maka ini disebut compound index
    //jd karena index ini ngambil size yg besar di database, jd di pilih2 aj keyword yg mana yg paling sering di masukkan user
    //keyword itulah yg kita bikinkan index
    //nah! ketika kita create field dari tour model diatas dengan unique: true. misalnya nama. Maka mongoDB secara otomatis akan membuat index dari field tersebut

tourSchema.index({ slug: 1 });
tourSchema.index({ startLocation: '2dsphere' });
    //We tell mongodb the index of startLoc should be 2dsphere

//Virtual Properties= Fields that we can define in our schema but it will not be persisted,
    //They will not save in database in order to save some space
tourSchema.virtual('durationWeeks').get(function() {//klo function jadul kita dapat akses ke this keyword
        //tp klo function arrow kita ga dpt akses ke this keyword
        //It cant be use as query, because technically they are not part of database
    return this.duration / 7;
});

//Virtual Populate
tourSchema.virtual('reviews', {//Jadi pas kita buka satu tour, terbuka juga virtual populate properties review nya
    //Jgn lupa di tourController, tulis jg di get


    ref: 'Review',//Ini sama dengan nama database mongoose yg lain atau yg mau kita connect kan
    foreignField: 'tour',//This is the name of the field in the other model, so in the Review model in this case, 
        //where the reference to the current model is stored.
        //and that is in this case the 'tour' field, in the review model
    localField: '_id'//We need to say where that ID is actually stored here in this current Tour model
        //So this _id which is how it's called in the local model is called 'tour' in the foreign model(review model)
});

// Mongoose has 4 middlewares: And we the define a middleware on the schema
// 1. Document (A middleware that can act on the currently processed document)
// 2. Query
// 3. Aggregate
// 4. Model Middleware

//1. Document Middleware. A pre save hook before saving a document, the keyword is pre.('save')
tourSchema.pre('save', function(next) {//pre gonna run before an actual event .save(update) and .create() command but not for update
    this.slug = slugify(this.name, { lower: true });//this keyword refers to the document that are currently being saved
    
    next();
});

// tourSchema.pre('save', async function(next) {//This code is responsible for performing Embedding/Denormalize Guides to Tour
//     //Ini utk pas nge create new tour, data guides/user nya behind the scene di embed ke dalam tour document
//     //klo ga pake function ini, data guides nya ga ada di embedded document, cuma id aja

//     const guidesPromises = this.guides.map(async id => await User.findById(id));

//     this.guides = await Promise.all(guidesPromises);//This code override array of embedded guides, with the retrieved data of guides in User document using map method
//         //we need to Promise.all
//         //because the result of this.guides.map(async id => await User.findById(id)); will return promise

//     next();
// });



// tourSchema.post('save', function(doc, next) {//here we dont actuall have the this, but actually have doc
//     console.log(doc);
//     next();
// })

//2. Query Middleware. A pre hook before search a query, the keyword is 'find'
tourSchema.pre(/^find/, function(next) {//ini bagus untuk bikin premium tour/course/membership
        // /^find/ ini disebut Regular Expression. artinya seluruh keyword yg ada kata 'find' nya. ex: findOne, findOneAndUpdate, findOneAndDelete
    this.find({ secretTour: { $ne: true } })//this keyword refers to the query. ne = not equal
    
    this.start = Date.now();

    next();
});

tourSchema.post(/^find/, function(docs, next) {//this middleware gonna run after the query is executed
    console.log(`Query took ${Date.now() - this.start} milliseconds! this log coming from all any find query tourschema tour model`);
    //console.log(docs)

    next();
});

tourSchema.pre(/^find/, function(next) {//This code is responsible for performing Referencing/Normalize Guides to Tour
    //Jadi ini hanya muncul pada saat find query saja. Guide ini tdk tersave di tour database
    //tapi dua database ini saling terkoneksi dengan method populate()

    this.populate({//this. always refers to current query
        path: 'guides',
        select: '-__v -passwordChangedAt'
    })

    next();
});

//3. Aggregation Middleware. A pre hook before get tour stats executed
tourSchema.pre('aggregate', function(next) {//Aggregation jg utk stattistik dgn metode pipeline
    //this.pipeline().unshift({ $match: { secretTour: { $ne: true } } });
        //unshift add an element infront of an array. shift() behind of an array
        //ini sengaja diaktifkan utk mengakomodasi $geoNear stage di exports.getDistances yg harus ada di stage pertama dalam method aggregate

    //console.log(this.pipeline());
    next();
});

const Tour =  mongoose.model('Tour', tourSchema);

module.exports = Tour;

// const testTour = new Tour({
//     name: 'The Park Camper',
//     price: 597
// });

// testTour.save().then(doc => {
//     console.log(doc);
// }).catch(err => {
//     console.log('ERROR server.js:', err)
// })