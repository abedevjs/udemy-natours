//di file js yg ini tempat dimana bnyak class,parent express di bentuk
//semua code disini terexecute berurutan. Jadi code yang paling bawah utk unhandled routes
//this here is global middleware
//When in production mode the interaction between server n client should be ini https for security sake

const path = require('path');//Used to manipulate path names
const express = require('express');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');//utk membatasi too many request dari satu IP, security reason
const helmet = require('helmet');//utk security memproteksi header
const mongoSanitize = require('express-mongo-sanitize');//utk Data Sanitization against NoSQL Query Injection
const xss = require('xss-clean');//utk //Data Sanitization against XSS (Cross-Site Script) attacks
const hpp = require('hpp');//utk security, Http Parameter Pollution
const cookieParser = require('cookie-parser');//This is a middleware, in order to get access to the cookie that are in our request

const appError =  require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');
const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');
const reviewRouter = require('./routes/reviewRoutes');
const bookingRouter = require('./routes/bookingRoutes');
const viewRouter = require('./routes/viewRoutes');


const app = express();

app.set('view engine', 'pug');//We tell express which engine to use for template 
app.set('views', path.join(__dirname, 'views'));//We tell express the location of views template

//1. GLOBAL MIDDLEWARES

//app.use(express.static(`${__dirname}/public`));//access ke html dan css (static) atau Serving Static Files
app.use(express.static(path.join(__dirname, 'public')));//access ke html dan css (static) atau Serving Static Files

app.use(helmet());// Set Security HTTP readers

console.log(process.env.NODE_ENV, 'abe dari app.js');//Development Logging
if(process.env.NODE_ENV === 'development') {//when in production mode the interaction between server n client should be ini https for security sake
    app.use(morgan('dev'));
}

// "start:prod": "SET NODE_ENV=production && nodemon server.js",

const limiter = rateLimit({//Limit request from same IP
    //this basically a middleware function, so now it can use app.use()

    max: 100,//the amount of request maximum
    windowMs: 60 * 60 * 1000,//60 menit * 60 second * 1000 milisecond < convert dari 1 jam ke milisecond
    message: 'Too many request from this IP, please try again in one hour!, dari app.js'
});
app.use('/api', limiter);//this basically will execute limiter to all of routes with /api

app.use(express.json({ limit: '10kb' }));//This middleware is called Body Parser, reading data from the body into req.body
    //when we have body larger than 10kb, it basically not be accepted

app.use(express.urlencoded({ extended: true, limit: '10kb' }));//ini untuk ambil data dari html submitted form

app.use(cookieParser());//This middleware parse the data from the cookie
    //the way that the form sends data to the server is actually also called urlencoded
    //extended: true < adalah option utk allow us to send some complex data

app.use(mongoSanitize());//Data Sanitization against NoSQL Query Injection
    //ini di tulis setelah body parser app.use(express.json({ limit: '10kb' }));

app.use(xss());//Data Sanitization against XSS (Cross-Site Script) attacks
    //Clean any user input from malicious HTML code from 
    //ini ditulis setelah body parser app.use(express.json({ limit: '10kb' }));

app.use(hpp({//Prevent Parameter Pollution
    //Ditulis di akhir utk clearing query string

    whitelist: [
        'duration', 'ratingsQuantity', 'ratingsAverage', 'maxGroupSize', 'difficulty', 'price'
    ]
}));

//code ini untuk demonstration aja
// app.use((req, res, next) => {
//     console.log('Hello from the middleware file app.js');
//     next();//next nya jgn lupa ditulis, klo ngga respond dari request clien berhenti disini. middleware yang lain seperti app.route yg didefine/tulis setelah code ini tdk di eksekusi
// });

app.use((req, res, next) => {
    req.requestTime = new Date().toISOString();//toISOString convert date into a readable string function
    //console.log('INI COOKIE, ',req.cookies);
    //console.log('req.requestTime ini utk apa app.js');
    next();
});

//status number meaning: 404(error), 200(ok), 201(created)

//Route = how to determine how an application response to certain client request (certain url, and http method)
// app.get('/', (req, res) => {//first argument is the root(alamat url), second argument is what to response for accessing this url. req res is an object
//     // res.status(200).send('Hello from the server side');//klo send utk hal simpel aja
//     res.status(200).json({Message: 'Hello from the server side', App: 'Natours'});
// });

// app.post('/', (req, res) => {
//     res.send('This is post');
// });

//3. ROUTE

// app.get('/api/v1/tours', getAllTour);
// app.get('/api/v1/tours/:id', getTour);
// app.post('/api/v1/tours', createTour);
// app.patch('/api/v1/tours/:id', updateTour);
// app.delete('/api/v1/tours/:id', deleteTour);

//These all here is a middleware that we mount
app.use('/', viewRouter);
app.use('/api/v1/tours', tourRouter);//mounting routers written/comes after the variable is declared
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRouter);
app.use('/api/v1/bookings', bookingRouter);

//ini route handler untuk seluruh url yg tdk terdefine/undhandle route
app.all('*', (req, res, next) => {//this all pointing to all the verbs http method (get, post, patch, delete, put, dll)
    //'*' refers to all url 

    // res.status(404).json({
    //     status: "fail",
    //     message: `This ${req.originalUrl} is unavailable app.js`
    // });

    // const err =  new Error(`This ${req.originalUrl} is unavailable app.js`);
    // err.status = 'fail'; 
    // err.statusCode = 404;
    next(new appError(`Can't find ${req.originalUrl} on this server. (dari app.js)`, 404));//if next function receives an argument no matter what is, express will automatically know that there was an error
        //it will skip all the middlewares in the middleware stack in application
});

//THIS IS OUR ERROR GLOBAL HANDLING MIDDLEWARE
//This middleware will catch any middlware that ends next(parameter)
app.use(globalErrorHandler);//if the there are 4 parameters then express automatically recognizes it as error handling middleware
    //app.use(err, req, res, next)

module.exports = app;


//PACKAGE.JSON SCRIPT
//"watch:js": "parcel watch ./public/js/index.js --out-dir ./public/js --out-file bundle.js",
//"build:js": "parcel watch ./public/js/index.js --out-dir ./public/js --out-file bundle.js"
// "watch:js": "parcel watch ./public/js/index.js --out-dir ./public/js --out-file bundle.js --public-url .",
// "build:js": "parcel build ./public/js/index.js --out-dir ./public/js --out-file bundle.js --public-url ."
// "start:prod": "SET NODE_ENV=production && nodemon server.js",

//di bundle.js
////# sourceMappingURL=/bundle.js.map
////# sourceMappingURL=/js/bundle.js.map
