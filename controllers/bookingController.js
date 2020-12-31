const Tour = require('./../models/tourModel');
const Booking = require('../models/bookingModel');
const factory = require('../controllers/handlerFactory');
const catchAsync = require('./../utils/catchAsync');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);//utk payment


// exports.getCheckoutSession = catchAsync(async (req, res, next) => {//Kita pake ini klo website sdh deployed
//     //1. Get the currently booked tour
//     const tour = await Tour.findById(req.params.tourId);

//     //2. Create checkout session
//     const session = await stripe.checkout.sessions.create({//These part below is the information about the session
//         payment_method_types: ['card'],
//         success_url: `${req.protocol}://${req.get('host')}/`,
//         cancel_url: `${req.protocol}://${req.get('host')}/tour/${tour.slug}`,
//         customer_email: req.user.email,
//         client_reference_id: req.params.tourId,//this is this session id that we gonna need later for booking
//         line_items: [//These part below is the information about the product
//             //these fields properties are built-in from stripes
//             {
//                 name: `${tour.name} Tour`,
//                 description: tour.summary,
//                 images: [`https://www.natours.dev/img/tours/${tour.imageCover}`],//they need to be live images
//                 amount: tour.price * 100,//need to multiply to 100 bcoz this amount is expected in cent
//                 currency: 'usd',//'eur'
//                 quantity: 1
//             }
//         ]
//     });

//     //3.Create session as response 
//     res.status(200).json({
//         status: 'success',
//         session
//     })
// });

exports.getCheckoutSession = catchAsync(async (req, res, next) => {//Kita pake ini klo website blm deployed
    //1. Get the currently booked tour
    const tour = await Tour.findById(req.params.tourId);

    //2. Create checkout session
    const session = await stripe.checkout.sessions.create({//These part below is the information about the session
        payment_method_types: ['card'],
        success_url: `${req.protocol}://${req.get('host')}/?tour=${req.params.tourId}&user=${req.user.id}&price=${tour.price}`,
        cancel_url: `${req.protocol}://${req.get('host')}/tour/${tour.slug}`,
        customer_email: req.user.email,
        client_reference_id: req.params.tourId,//this is this session id that we gonna need later for booking
        line_items: [//These part below is the information about the product
            //these fields properties are built-in from stripes
            {
                name: `${tour.name} Tour`,
                description: tour.summary,
                images: [`https://www.natours.dev/img/tours/${tour.imageCover}`],//they need to be live images
                amount: tour.price * 100,//need to multiply to 100 bcoz this amount is expected in cent
                currency: 'usd',//'eur'
                quantity: 1
            }
        ]
    });

    //3.Create session as response 
    res.status(200).json({
        status: 'success',
        session
    })
});

exports.createBookingCheckout = catchAsync(async (req, res, next) => {
    //Ini nggak secure, ini untuk ngetes booking
    const { tour, user, price } = req.query;

    if(!tour && !user && !price) return next()

    await Booking.create({ tour, user, price })

    res.redirect(req.originalUrl.split('?')[0])//redirect < create a new request but to this new url that we pass in there
});

exports.createBooking = factory.createOne(Booking);
exports.getBooking = factory.getOne(Booking);
exports.getAllBooking = factory.getAll(Booking);
exports.updateBooking = factory.updateOne(Booking);
exports.deleteBooking = factory.deleteOne(Booking);


