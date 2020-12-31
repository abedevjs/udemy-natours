const Tour = require('./../models/tourModel');
const User = require('./../models/userModel');
const Booking = require('./../models/bookingModel');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');

exports.getOverview = catchAsync(async (req, res, next) => {//Ini route utk Template Engine
    //http://127.0.0.1:3000

    const tours =  await Tour.find();

    res.status(200).render('overview', {
        title: 'All Tours',
        tours
    });
});

exports.getTour = catchAsync(async (req, res, next) => {//Ini route utk Template Engine
    
    //1. Get the data for the requested tour, including reviews and guides
    const tour = await Tour.findOne({ slug: req.params.slug }).populate({
        path: 'reviews',
        fields: 'review rating user'
    });

    if (!tour) {
        return next(new AppError('There is no tour with that name', 404));
    }

    res.status(200).set(
        'Content-Security-Policy',
        "default-src 'self' https://*.mapbox.com ;base-uri 'self';block-all-mixed-content;font-src 'self' https: data:;frame-ancestors 'self';img-src 'self' data:;object-src 'none';script-src https://cdnjs.cloudflare.com https://api.mapbox.com 'self' blob: ;script-src-attr 'none';style-src 'self' https: 'unsafe-inline';upgrade-insecure-requests;"
      ).render('tour', {
        title: `${tour.name} tour`,
        tour
    });

    // res.status(200)
    //   .render('tour', {
    //     title: `${tour.name} tour`,
    //     tour
    // });
});

exports.getLoginForm = (req, res) => {
    res.status(200)
        .set(
            'Content-Security-Policy',
            "connect-src 'self' https://cdnjs.cloudflare.com"
        )
        .render('login', {
        title: 'Log into your account',
    });

    // res.status(200)
    //     .render('login', {
    //     title: 'Log into your account',
    // });
};

exports.getAccount = (req, res) => {//Account page
        //So to get to account page, all we really need to do is to simply render that page
        //we dont even need to query for the current user because that already been done in the protect middleware
        //all we really need to is to give render

    res.status(200)
        .render('account', {
        title: 'Your account'
    });
};

exports.getMyTours = catchAsync(async (req, res, next) => {
    //1. Find all bookings
    const bookings = await Booking.find({ user: req.user.id });

    //2. Find tours with the returned IDs
    const tourIDs = bookings.map(el => el.tour);

    const tours = await Tour.find({ _id: { $in: tourIDs } });
        //it will select all the tour which have an id in the tourIDs array

    res.status(200).render('overview', {
        title: 'My Tours',
        tours
    })
});

exports.updateUserData =catchAsync (async(req, res, next) => {//Ini route utk ambil data dari html form
    //console.log('sukses viewcontroller');
    const updatedUser = await User.findByIdAndUpdate(req.user.id, {
        name: req.body.name,
        email: req.body.email
            //req.body.name dan req.body.email. Pada name dan email adalah name yg kita specified di html bukan dari userModel
    }, 
    {
        new: true,
        runValidators: true
    });

    res.status(200)
        .render('account', {
        title: 'Your account',
        user: updatedUser
    });
});