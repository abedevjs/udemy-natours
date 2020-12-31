//di file js yg ini list tempat dimana route alamat/url di define yg client bisa request/akses
const express = require('express');
const tourController = require('./../controllers/tourController');
const authController = require('./../controllers/authController');
const reviewRouter = require('./../routes/reviewRoutes');
const router = express.Router();

//router.param('id', tourController.checkID);//klo param middleware utk url yg ada id nya. menerima 4 argumen: req, res, next, val.

//Nested Routes, when there is a clear Parent-Child resources
    //POST /tour/tour:id/reviews < reviews is clearly a child of tour
    //GET /tour/tour:id/reviews
    //GET /tour/tour:id/reviews/review:id
    //It's easier than query string
    router.use('/:tourId/reviews', reviewRouter);

//127.0.0.1:3000/api/v1/tours ini jg bisa dibilang route using the get, post, patch, delete, methode

router.route('/top-5-cheap')
    .get(tourController.aliasTopTours, tourController.getAllTours);

router.route('/tour-stats')
    .get(tourController.getTourStats);

router.route('/monthly-plan/:year')///:year disebut url parameter
    .get(authController.protect, authController.restrictTo('admin', 'lead-guide', 'guide'), tourController.getMonthlyPlan);

router.route('/tours-within/:distance/center/:latlng/unit/:unit')
    .get(tourController.getToursWithin);

router.route('/distances/:latlng/unit/:unit')
    .get(tourController.getDistances);

router
    .route('/')
    .get(tourController.getAllTours)//for the currently logged in user
    .post(authController.protect, authController.restrictTo('admin', 'lead-guide'), tourController.createTour);

router.route('/:id')
    .get(tourController.getTour)
    .patch(authController.protect, authController.restrictTo('admin', 'lead-guide'),
        tourController.uploadTourImages,
        tourController.resizeTourImages,
        tourController.updateTour)
    .delete(authController.protect, authController.restrictTo('admin', 'lead-guide'), tourController.deleteTour);//for the currently logged in user

module.exports = router;//this is when only one thing to export