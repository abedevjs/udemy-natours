//di file js yg ini list tempat dimana route alamat/url di define yg client bisa request/akses
//All these routers are middleware. And all these middlewares are run in sequence.

const express = require('express');
const userController = require('./../controllers/userController');
const authController = require('./../controllers/authController');


const router = express.Router();

//THESE FOUR ROUTES ARE FOR PUBLIC

router.post('/signup', authController.signup);
router.post('/login', authController.login);
router.get('/logout', authController.logout);
router.post('/forgotPassword', authController.forgotPassword);
router.patch('/resetPassword/:token', authController.resetPassword);


 

//THE REST OF THESE ROUTES ARE FOR LOGGED IN USER
router.use(authController.protect);
    //All these routers are middleware. And middlewares are run in sequence.
    //So in order to access these routes below it will have to pass the this authController.protect middleware first
    //Because this route is declared first,before these middlewares below

router.patch('/updateMyPassword/', authController.updatePassword);//for the currently logged in user
router.get('/me', userController.getMe, userController.getUser);
router.patch('/updateMe', userController.uploadUserPhoto, userController.resizeUserPhoto, userController.updateMe);
router.delete('/deleteMe', userController.deleteMe);

router.use(authController.restrictTo('admin'));
    //After this route, all routes is protected and restricted

router.route('/')
    .get(userController.getAllUsers)
    .post(userController.createUser);

router.route('/:id')
    .get(userController.getUser)
    .patch(userController.updateUser)
    .delete(userController.deleteUser);

module.exports = router;