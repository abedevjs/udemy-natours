//di file js ini tempat dimana route/alamat url di define yg client bisa request

const express = require('express');
const reviewController = require('./../controllers/reviewController');
const authController = require('./../controllers/authController');
const router = express.Router({ mergeParams: true });
    //Secara default each route only for their specific routes
    //kita butuh akses tour:Id dari router router.use('/:tourId/reviews', reviewRouter); di tourRoute
    //maka dari itulah kita aktifkan mergeParams: true

router.use(authController.protect);

router.route('/')
    .get(reviewController.getAllReviews)
    .post(authController.restrictTo('user'), reviewController.setTourUserIds, reviewController.createReviews);

router.route('/:id')
    .get(reviewController.getReview)
    .patch(authController.restrictTo('user', 'admin'), reviewController.updateReview)
    .delete(authController.restrictTo('user', 'admin'), reviewController.deleteReview);







module.exports = router;