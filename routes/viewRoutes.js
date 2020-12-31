const express = require('express');
const router = express.Router();
const viewsController = require('./../controllers/viewsController');
const Tour = require('./../models/tourModel');
const authController = require('./../controllers/authController');
const bookingController = require('./../controllers/bookingController');

// router.get('/', (req, res, next) => {//Ini route utk Template Engine
//     res.status(200).render('base', {
//         title: 'Exciting tours for adventurous people'
//     });
// });
 
router.get('/', bookingController.createBookingCheckout, authController.isLoggedIn, viewsController.getOverview);
router.get('/tours/:slug', authController.isLoggedIn, viewsController.getTour);
router.get('/login', authController.isLoggedIn, viewsController.getLoginForm)
router.get('/me', authController.protect, viewsController.getAccount);
router.get('/my-tours', authController.protect, viewsController.getMyTours);

// router.post('/submit-user-data', authController.protect, viewsController.updateUserData);
    //ambil html data tanpa API

module.exports = router;