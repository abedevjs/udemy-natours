//di file js yg ini tempat dimana bnyak di define respon dari permintaan client tentang tour
//const fs = require('fs');
const Tour = require('./../models/tourModel');
const APIFeatures = require('./../utils/apiFeatures');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/AppError');
const factory = require('./handlerFactory');
const multer= require('multer');//Is a middleware for multi-part form data
const sharp = require('sharp');//Image processing library for nodeJs. npm i sharp

const multerStorage = multer.memoryStorage();//This way, the image will be stored as a buffer
    //karena kita mau resize jadi ini ter save dulu di memory, terus dari resizeUser kita read image tsb
    //barulah setelah resize kita save di disk

const multerFilter = (req, file, cb) => {//How to filter the upload file
    if(file.mimetype.startsWith('image')) {//Is basically to test if it's an image
        //We also can filter for only csv or mp3 or png or anyother file
        cb(null, true);
    } else {
        
        cb(new Apperror('Not an image, please upload only images', 400), false);//400 bad request
    }
};

const upload = multer({//all these property name are from multer
    storage: multerStorage,
    fileFilter: multerFilter
});

exports.uploadTourImages = upload.fields([

    { name: 'imageCover', maxCount: 1 },
    { name: 'images', maxCount: 3 }
]);

exports.resizeTourImages = catchAsync(async (req, res, next) => {
    console.log(req.files);

    if(!req.files.imageCover || !req.files.images) return next();

    //1. Cover Image

    req.body.imageCover = `tour-${req.params.id}-${Date.now()}-cover.jpeg`;
        //remember that this route (patch:updateTour) is with id of the tour, so we have params.id

    await sharp(req.files.imageCover[0].buffer)
        .resize(2000, 1333)//3/2 ratio, which is very common in images
        .toFormat('jpeg')
        .jpeg({ quality: 90 })
        .toFile(`public/img/tours/${req.body.imageCover}`)

    //2. images

    req.body.images = [];

    //req.files.images.forEach(async (file, i) => {// This async is not really working because it is inside of the forEach method
        //so we use Promise.all() wwith map method so it can be stored in new array
    await Promise.all(req.files.images.map(async (file, i) => {
        //so all this map array will be saved in Promise.all() and directly executed

        const filename = `tour-${req.params.id}-${Date.now()}-${ i + 1 }.jpeg`

        await sharp(file.buffer)
            .resize(2000, 1333)//3/2 ratio, which is very common in images
            .toFormat('jpeg')
            .jpeg({ quality: 90 })
            .toFile(`public/img/tours/${filename}`)

        req.body.images.push(filename);
    }));

    next();
});

//const tours = JSON.parse(fs.readFileSync(`${__dirname}/../dev-data/data/tours-simple.json`));

// exports.checkID = (req, res, next, val) => {

//     if(req.params.id * 1 > tours.length) {
//         return res.status(404).json({//if there isnt 'return' then the message is sent back and the code is still running
//             status: 'fail',
//             message: 'Invalid ID'
//         })
//     }

//     next();
// };

// exports.checkBody = (req, res, next) => {//this is to show us how middleware works
//     if(!req.body.name || !req.body.price) {
//         return res.status(400).json({
//             status: 'fail',
//             message: 'Missing Name or Price'
//         })
//     }

//     next();
// };

//127.0.0.1:3000/api/v1/tours?limit=5&sort=-ratingsAverage
exports.aliasTopTours = (req, res, next) => {//this is middleware, the third argument is next
    req.query.limit = '5';
    req.query.sort = '-ratingsAverage,price';
    req.query.fields = 'name,price,ratingsAverage,summary,difficulty';

    next();
};

exports.getAllTours = factory.getAll(Tour);

// exports.getAllTours = catchAsync(async (req, res, next) => {
//     //console.log(req.query)
//     //console.log(req.requestTime)

//     // //WE BUILD THE QUERY
//     //     //1. Filtering
//     // const queryObj = { ...req.query };
//     //         //1. ini namanya destructuring
//     //         //2. {} ini create new object

//     // const excludeFields = ['page', 'sort', 'limit', 'fields'];
//     // excludeFields.forEach(el => delete queryObj[el]);

//     //     //2. Advanced Filtering
//     // let queryStr = JSON.stringify(queryObj);//JSON.stringify convert object json ke string
//     // queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, match => `$${match}`);
//     //     //ok penjelasan ini ada di folder 8 video 15
//     //     //127.0.0.1:3000/api/v1/tours?duration[gte]=5
//     //     //127.0.0.1:3000/api/v1/tours?price[lt]=1500&duration[gte]=5

//     // let query = Tour.find(JSON.parse(queryStr));//JSON.parse convert string ke JSON object

//     //     //3. Sorting
//     // if(req.query.sort) {//127.0.0.1:3000/api/v1/tours?sort=price, 127.0.0.1:3000/api/v1/tours?sort=price.ratingsAverage
//     //     const sortBy = req.query.sort.split(',').join(' ');
//     //     query = query.sort(sortBy);
//     // } else {
//     //     query = query.sort('-createdAt');
//     // }

//     //     //4. fields
//     // if(req.query.fields) {//127.0.0.1:3000/api/v1/tours?fields=name, duration,price
//     //     const fields = req.query.fields.split(',').join(' ');
//     //     query = query.select(fields);
//     // } else {
//     //     query = query.select('-__v');//tanda minus artinya we dont show it to the client
//     // }

//     //     //5. Pagination. 1-10 page 1, 11-20 page 2, 21-30 page 3
//     //         //127.0.0.1:3000/api/v1/tours?page=1&limit=3
//     // const page = req.query.page * 1 || 1;
//     //     //req.query.page * 1 artinya convert string ke number (a trick)
//     //     // || 1; command ini artinya by default di set ke page 1
        
//     // const limit = req.query.limit * 1 || 100;
//     //     // || 100; by default document yg keluar berjumlah 100
        
//     // const skip = (page - 1) * limit;
//     // query = query.skip(skip).limit(limit);

//     // if(req.query.page) {
//     //     const numTours = await Tour.countDocuments();
//     //     if(skip >= numTours) throw new Error('This page doesnt exist! from tour controller.js')
//     // }
        
//     //The first/normal way to write a query
//     // const tours = await Tour.find({//find() adalah command keyword di mongodb, this returns query
//     //     duration: 2,
//     //     difficulty: 'easy'
//     // });
        
//     //Another way to write a query, using Mongoose method
//     //const tours = await Tour.find().where('duration').equals(5).where('difficulty').equals('easy');

//     //WE EXECUTE THE QUERY
//     const features = new APIFeatures(Tour.find(), req.query)
//         .filter()
//         .sort()
//         .limitFields()
//         .paginate();

//     const tours = await features.query;
        
//     //WE SEND THE RESPONSE
//     res.status(200).json({
//         status: 'success',//fail(to client), error(to server)
//         //requestedAt: req.requestTime,
//         results: tours.length,
//         data: {
//             tours// tours: tours
//         }
//     });
    
//     // try {
        

//     // } catch(err) {
//     //     res.status(404).json({
//     //         status: "fail dari tourController.getAllTours",
//     //         message: err
//     //     })
//     // }
// });

exports.getTour = factory.getOne(Tour, { path: 'reviews' });

// exports.getTour = catchAsync(async (req, res, next) => {//cara membaca url parameters
//     //const id = req.params.id * 1;//cara untuk merubah string ke angka
    
//     // const tour = tours.find(el => el.id === id);
 
//     const tour = await Tour.findById(req.params.id).populate('reviews');
//         //ini sama dengan Tour.findOne({ _id: req.params.id })
//         //methode nya mongoose
//         //.populate('reviews') terikat dengan tourSchema.virtual('reviews', {}) di tour model
    
//     if(!tour) {//if there is no tour
//         return next(new AppError('No tour found with that ID', 404));
//         //ingat lagi command return disini berfungsi jika ada error, maka operasi berhenti disini
//         //jika tdk ada return maka dy move on ke next line of code
//         //jika ini terjadi maka kita dibilang memberikan dua response.
//         //padahal 2 response dalam satu function(req, res, next) ga bisa (error)
//     }

//     res.status(200).json({
//         status: 'success',
//         data: {
//                 tour
//         }
//     });
    
//     // try {
        

//     // } catch(err) {
//     //     res.status(404).json({
//     //         status: "fail",
//     //         message: err
//     //     })
//     // }
// });

exports.createTour =  factory.createOne(Tour);

// exports.createTour = catchAsync(async (req, res, next) => {
//     // console.log(req.body);

//     // const newTour = new Tour({})//ini salah satu cara utk create tour
//     // newTour.save()//this returns promise (then)

//     const newTour = await Tour.create(req.body);//data req.body dari POST request
//         //jd ini req.body dari object yang kita buat pake mongoose model yaitu tourSchema di tourModel.js
//         //jd ini seperti cara membaca data yg dimasukkan oleh user

//     res.status(201).json({
//         status: "success",
//         data: {
//             tour: newTour
//         }
//     });
    
//     // try {
         

//     // } catch(err) {
//     //     res.status(400).json({
//     //         status: "fail",
//     //         message: err
//     //     })
//     // }
    
// });

exports.updateTour = factory.updateOne(Tour);//bukan termasuk utk update password

// exports.updateTour = catchAsync(async (req, res, next) => {
//     const tour = await Tour.findByIdAndUpdate(req.params.id, req.body, {//methode nya mongoose
//         new: true,
//         runValidators: true//ini berhubungan langsung dengan tour schema, bisa di set ke false
//     });

//     if(!tour) {//if there is no tour
//         return next(new AppError('No tour found with that ID', 404));
//         //ingat lagi command return disini berfungsi jika ada error, maka operasi berhenti disini
//         //jika tdk ada return maka dy move on ke next line of code
//         //jika ini terjadi maka kita dibilang memberikan dua response.
//         //padahal 2 response dalam satu function(req, res, next) ga bisa (error)
//     }

//     res.status(200).json({
//         status: "success",
//         data: {
//           tour //atau tour: tour < krn es6 jd lebih simpel
//         }
//     });

//     // try {
        

//     // } catch(err) {
//     //     res.status(404).json({
//     //         status: "fail",
//     //         message: err
//     //     });
//     // }
    
// });

exports.deleteTour = factory.deleteOne(Tour);

// exports.deleteTour = catchAsync(async (req, res, next) => {
//     const tour = await Tour.findByIdAndDelete(req.params.id);//when delete operation we dont send any feed back to the client
    
//     if(!tour) {//if there is no tour
//         return next(new AppError('No tour found with that ID', 404));
//         //ingat lagi command return disini berfungsi jika ada error, maka operasi berhenti disini
//         //jika tdk ada return maka dy move on ke next line of code
//         //jika ini terjadi maka kita dibilang memberikan dua response.
//         //padahal 2 response dalam satu function(req, res, next) ga bisa (error)
//     }

//     res.status(204).json({//204 standard response utk delete operation
//         status: 'success',
//         data: null
//     });
    
//     // try {
        

//     // } catch(err) {
//     //     res.status(404).json({
//     //         status: "fail",
//     //         message: err
//     //     });
//     // }
    
// });

exports.getTourStats = catchAsync(async (req, res, next) => {
    const stats = await Tour.aggregate([//aggregate method only used in the model not instances
            //These below here we construct what we called our aggregation pipeline
        {
            $match: { ratingsAverage: { $gte: 4.5 } }
        },
        {
            $group: {
                _id: null,
                //_id: '$difficulty',
                //_id: '$ratings',
                //_id: { $toUpper: '$difficulty' },
                numTours: { $sum: 1 },
                numRatings: { $sum: '$ratingsQuantity' },
                avgRating: { $avg: '$ratingsAverage' },
                avgPrice: { $avg: '$price' },
                minPrice: { $min: '$price' },
                maxPrice: { $max: '$price' }
            }
        },
        {
            $sort: {
                avgPrice: 1
            }
        }
        // {
        //     $match: {
        //         _id: { $ne: 'EASY' }
        //     }
        // }
    ]);

    res.status(200).json({
        status: "success",
        data: {
          stats //atau stats: stats < krn es6 jd lebih simpel
        }
    });

    // try {
        

    // } catch(err) {
    //     res.status(404).json({
    //         status: "fail, dari tourController.getTourStats",
    //         message: err
    //     });
    // }
});

exports.getMonthlyPlan =  catchAsync(async (req, res, next) => {//127.0.0.1:3000/api/v1/tours/monthly-plan/2021
    const year = req.params.year * 1;
    const plan = await Tour.aggregate([//aggregate method only used in the model not instances
            //These below here we construct what we called our aggregation pipeline
        {//deconstruct/extract one element from a document
                $unwind: '$startDates'
        },
        {
            $match: {
                startDates: {//2021
                    $gte: new Date(`${year}-01-01`),
                    $lte: new Date(`${year}-12-31`)
                }
            }
        },
        {
            $group: {
                _id: { $month: '$startDates' },
                numToursStarts: { $sum: 1 },
                tours: { $push: '$name' }
            }
        },
        {
            $addFields: { month: '$_id' }
        },
        {
            $project: {
                _id: 0//klo 0 berarti disappear. Klo 1 berarti appear
            }
        },
        {
            $sort: { numTourStats: -1 }//1 descending. -1 ascending
        },
        {
            $limit: 12
        }
    ]);

    res.status(200).json({
        status: "success",
        data: {
            plan //atau plan: plan < krn es6 jd lebih simpel
        }
    });
    
    // try {
        

    // } catch (err) {
    //     res.status(404).json({
    //         status: "fail, dari tourController.getMonthlyPlan",
    //         message: err
    //     });
    // }
});

exports.getToursWithin =  catchAsync(async (req, res, next) => {//{{URL}}api/v1/tours/tours-within/1000/center/33.968925,-118.143988/unit/mi
    // /tours-within/:distance/center/:latlng/unit/:unit < distance ini maksudnya radius
    // /tours-within/400/center/33.968925,-118.143988/unit/mi
    // Makassar -5.147408, 119.425751
    
    const { distance, latlng, unit } = req.params;
    const [ lat, lng ] = latlng.split(',');
    const radius = unit === 'mi' ? distance / 3963.2 : distance / 6378.1;
        //The unit is either 'mi' or 'km
        //Mongodb expects radius of a sphere to be in radians, so this converts to a special units called radians
        //In order to get the radians we need to divide our distance by the radius of the earth 

    if(!lat || !lng) {
        next(new AppError('Please provide latitude and longitude in the format lat, lng', 400));
    } 

    const tours = await Tour.find({ 
        startLocation: { $geoWithin: { $centerSphere: [[lng, lat], radius] } } //in mongodb longitude first then latitude
    })
    
    res.status(200).json({
        status: "success",
        results: tours.length, 
        data: {
            data: tours
        }
    })
});

exports.getDistances =  catchAsync(async (req, res, next) => {//{{URL}}api/v1/tours/distances/33.968925,-118.143988/unit/km
    //Ini utk calculate jauhnya jarak sebuah titik lokasi dengan seluruh tour dalam database

    const { distance, latlng, unit } = req.params;
    const [ lat, lng ] = latlng.split(',');

    const multiplier = unit === 'mi' ? 0.000621371 : 0.001;
        // if unit is mile then multiply it by 0.000621371 (ini dpt dr google 1 mile = 0.000621371 meter )
        // if unit is other than that (is km) then multiply it by 0.001  atau bagi 1000

    if(!lat || !lng) {
        next(new AppError('Please provide latitude and longitude in the format lat, lng', 400));
    } 

    const distances = await Tour.aggregate([
        {
            $geoNear: {//$geoNear always in the first stage define, maka dari itu kita sdh nonaktifkan, 
                //tourSchema.pre('aggregate', function(next) yg isinya  this.pipeline().unshift({ $match: { secretTour: { $ne: true } } }); di tourModel 
                //$geoNear requires at least one of our fields contains a geospacial index,
                //dalam hal ini sudah diwakilkan tourSchema.index({ startLocation: '2dsphere' });

                near: {//is to point from which to calculate the distances
                    type: 'Point',
                    coordinates: [lng * 1, lat * 1]//dikali satu biar dia otomatis terconvert ke number
                },
                distanceField: 'distance',
                distanceMultiplier: multiplier//distance distanceMultiplier ada mongoose built-in perkalian
            }
        },
        {
            $project: {//The names of the fields that we want to keep
                distance: 1,
                name: 1
            }
        }
    ]);

    res.status(200).json({
        status: "success",
        data: {
            data: distances
        }
    })
}); 