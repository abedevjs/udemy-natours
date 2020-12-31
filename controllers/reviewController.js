//disini tempat dimana di define function yg  keluar utk respon dari url yg di request client lwt route

const catchAsync = require('./../utils/catchAsync');
const Review = require('./../models/reviewModel');
const AppError = require('./../utils/AppError');
const factory = require('./handlerFactory');

exports.getAllReviews = factory.getAll(Review);

// exports.getAllReviews = catchAsync(async (req, res, next) => {//{{URL}}api/v1/reviews
//     let filter = {}

//     if(req.params.tourId) filter = {tour: req.params.tourId};//Untuk melihat seluruh id dari tour tertentu
//         //Ini klo ada request pake tour id
//         //GET /tour/tour:id/reviews
//         //{{URL}}api/v1/tours/5c88fa8cf4afda39709c2955/reviews
        
//     const reviews = await Review.find(filter);//Klo filter nya ga ada berarti objek kosong, ga masalah

//     res.status(200).json({
//         status: 'success',
//         results: reviews.length,
//         data: {
//             reviews
//         }
//     })
// });

exports.setTourUserIds = (req, res, next) => {//ini gak catch async krn menurut ku isinya ngecek dulu
    if(!req.body.tour) req.body.tour = req.params.tourId;
    if(!req.body.user) req.body.user = req.user.id;

    next();
};


exports.createReviews = factory.createOne(Review)


// exports.createReviews = catchAsync(async (req, res, next) => {
    
//     //2 ifs dibawah ini untuk Nested Routes
//     if(!req.body.tour) req.body.tour = req.params.tourId;
//         //If we didnt specify the tour id in the body, 
//         //then we want to define that as the one coming from url
//         //router.route('/:tourId/reviews').post(authController.protect, authController.restrictTo('user'), reviewController.createReviews);
    
//     if(!req.body.user) req.body.user = req.user.id;

//     const newReview = await Review.create(req.body);

//     res.status(201).json({//201 created
//         status: 'success',
//         data: {
//             review: newReview
//         }
//     })
// });

exports.deleteReview = factory.deleteOne(Review);//bukan termasuk utk update password
exports.updateReview = factory.updateOne(Review);
exports.getReview = factory.getOne(Review);