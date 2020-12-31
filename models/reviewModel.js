const mongoose = require('mongoose');
const Tour = require('./tourModel');
const { findByIdAndDelete } = require('./userModel');

const reviewSchema = new mongoose.Schema({
    review: {
        type: String,
        required: [true, 'Review can not be empty']
    },
    rating: {
        type: Number,
        min: [1, 'Rating must be above than 1.0'],//this min-max not only works for number but also for dates
        max: [5, 'Rating must be less than 5.0']
    },
    createdAt: {
        type: Date,
        default: Date.now()
    },
    tour: {//Ini cara klo mau bikin Parent-Child Referencing. Review sebagai childnya
            //Agar bisa di pake, di buatkan Query Middleware yg di dalamnya ada method Populate
        type: mongoose.Schema.ObjectId,
        ref: 'Tour',
        required: [true, 'Review must belong to a tour']
    },
    user: {//Ini cara klo mau bikin Parent-Child Referencing. Review sebagai childnya
        //Agar bisa di pake, di buatkan Query Middleware yg di dalamnya ada method Populate
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: [true, 'Review must belong to a user']
    }
},
{//2nd argument:  object for options
    //All these does is to make sure, when we have a virtual property(field not stored in database, but calculated using some other value), 
    //we want also this is show up when there is an output
    toJSON: { virtuals: true },//Virtual Properties= Fields that we can define in our schema but it will not be persisted
    toObject: { virtuals: true }
});

reviewSchema.index({ tour: 1, user: 1 }, { unique: true });//Ini biar tiap user hnya bisa post 1 review di tour tertentu
    //reviewSchema.index({ value }, { options }); < penjelasan argumennya

//Query Middleware to Populate reviews with pre 
reviewSchema.pre(/^find/, function(next) {//Ini Parent-Child Referencing. Review adalah child dari tour dan user.
    //Di Parent-Child referencing, Parent ga tau child nya yg mana saja

    // this.populate({
    //     path: 'tour',
    //     select: 'name'
    // }).populate({
    //     path: 'user',
    //     select: 'name photo'
    // })

    this.populate({
        path: 'user',
        select: 'name photo'
    })


    next();
});

reviewSchema.statics.calcAverageRatings = async function(tourId) {//ini untuk menghitung average rating dalam tour tertentu
        //In order to calc average we need to use the aggeragate method. And this method can only be used using the model it self, so we use statics method
        //In the statics method this keyword refers to current model
        //We call aggregate always on the model
    const stats = await this.aggregate([//These below here we construct what we called our aggregation pipeline
        {
            $match: {tour: tourId}//To select all the reviews that actually belong to the current tour, that was passed in the argument (tourId)
        },
        {
            $group: {
                _id: '$tour',
                nRating: { $sum:1 },//Add one review of each tour that we have
                avgRating: { $avg: '$rating' }//Here the name of the field is called rating, so that's where we want to calculate the average from
                    //Jd dgn menggunakan seluruh keyword diatas ini $sum, $avg, mongoose sdh otomatis mengkalkulasi semuanya
            }
        }
    ])

    //console.log(stats);//[ { _id: 5fe054ff74bf151ed4388e30, nRating: 2, avgRating: 4 } ]
    //Kemudian hasil perhitungan ini kita simpan di database
    if(stats.length > 0) {
        await Tour.findByIdAndUpdate(tourId, {//findByIdAndUpdate method is a promise, so we await
            ratingsQuantity: stats[0].nRating,//perhatikan hasil consolo.log diatas: array yg berisi satu element. Dari element itu kita select yg mana kita mau ambil
            ratingsAverage: stats[0].avgRating
        })
    } else {
        await Tour.findByIdAndUpdate(tourId, {//findByIdAndUpdate method is a promise, so we await
            ratingsQuantity: 0,//perhatikan hasil consolo.log diatas: array yg berisi satu element. Dari element itu kita select yg mana kita mau ambil
            ratingsAverage: 4.5 //default average rating on tour
        })
    }
};

reviewSchema.post('save', function() {//This points to current document/review. Jadi setiap ada review yg di save, maka function dibawahnya ter execute
    this.constructor.calcAverageRatings(this.tour);
        //this.constructor < this keywords refers to current document. and the constructor is the model who created that document. So this.constructor < the tour
});

//CARA UPDATE AVERAGE RATING DAN RATING QUANTITY REVIEW SETELAH USER UPDATE DAN DELETE POSTINGANNYA
//Kita tidak bisa pake findByIdAndUpdate & findByIdAndDelete 2 method ini bukan document middleware tapi query middleware.
//Dan di query middleware kt tdk punya akses modify document seperti this.constructor.calcAverageRatings(this.tour);
//Makanya kita simpan di property baru yaitu this.r
//Jadi begini solusinya: Kita buat query pre middleware dl dgn regular expression findOneAnd
reviewSchema.pre(/^findOneAnd/, async function(next) {//jd function ini hanya untuk ambil the current review yg being updated aja
        //kita ga bisa update ini karena function calcAvg nya di pre, sementara this.constructor.calcAverageRatings(this.tour); di post
        //ingat klo pre dapat akses ke next, klo post tdk.
    this.r = await this.findOne();//Kita ambil dulu document yg di update. This keywords refers to this query
        //Kita bikin property baru (r) terus disimpan di properti ini agar kemudian bisa di akses di post method setelahnya, maksudnya id documentnya
        
    //console.log(this.r);//_id: 5fe05840ea3ab92ab0b5ad38,
    next();
});

reviewSchema.post(/^findOneAnd/, async function() {//disinilah kita execute function calcAvg nya krn sdh di post
    //await this.r = await this.findOne(); does not work here, query has already executed

    await this.r.constructor.calcAverageRatings(this.r.tour)
    //this.r.constructor this keywords refers to current document
});







const Review = mongoose.model('Review', reviewSchema);
module.exports = Review;