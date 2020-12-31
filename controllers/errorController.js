const AppError = require("../utils/AppError");

const handleCastErrorDB = err => {//127.0.0.1:3000/api/v1/tours/www
    const message =  `Invalid ${err.path}: ${err.value}.`
    return new AppError(message, 400);
};

const handleDuplicateFieldsDB = err => {//127.0.0.1:3000/api/v1/tours/ > update kasi nama tour yang sama
    const value = err.errmsg.match(/(["'])(\\?.)*?\1/)[0];
    const message = `Duplicate value: ${value}. Please use another value!`;

    return new AppError(message, 400);
};

const handleValidationErrorDB = err => {//127.0.0.1:3000/api/v1/tours/5fceaffd82006222e45d5a0c
    //misalnya kalo kita update tour tapi nama, rating, durasi asal2an

    const errors = Object.values(err.errors).map(el => el.message)//we loop over
        //jadi kita ambil dulu pesan error nya dari tiap object
        //trus dari tiap object error itu kita ambil message nya aja

    const message = `Invalid input data. ${errors.join('. ')}`;

    return new AppError(message, 400);
};

const handleJWTError = () => new AppError('Invalid token please login again', 401);
const handleJWTExpiredError = () => new AppError('This token has expired, please login again', 401);

// const sendErrorDev = (err, res) => {//This is written BEFORE folder 12 video 20

//     err.statusCode = err.statusCode || 500;
//     console.log(err);
//     res.status(err.statusCode).json({
//       status: err.status,
//       error: err,
//       message: err.message,
//       stack: err.stack
//     });
// };

const sendErrorDev = (err, req, res) => {//This is written AFTER folder 12 video 20
    //API
    if(req.originalUrl.startsWith('/api')) {//app.use('/api/v1/
        //liat di app.js bagian mounting routes

        console.log(err);

        res.status(err.statusCode).json({//statusCode ini sdh kita define di utils/AppError.js
            status: err.status,
            error: err,
            message: err.message,
            stack: err.stack
        });
    } else {
        //RENDERED WEBSITE
        console.error('UNEXPECTED ERROR 💥', err);
        res.status(err.statusCode).render('error', {//app.use('/', viewRouter);
            //liat di app.js bagian mounting routes

            title: 'Something went wrong',
            msg: err.message
        });
    }
    
};
 
/////////////////////////////////////////////////////////////////////////////////////////////////////

// const sendErrorProd = (err, res) => {//This is written BEFORE folder 12 video 20
//     // Operational, trusted error: send message to client
//     if (err.isOperational) {
//         console.log(err);
//         res.status(err.statusCode).json({
//             status: err.status,
//             message: err.message
//       });
  
//       // Programming or other unknown error: don't leak error details
//     } else {
//       // 1) Log error
//       console.error('ERROR 💥', err);
  
//       // 2) Send generic message
//       res.status(500).json({
//         status: 'error',
//         message: 'Something went very wrong!'
//       });
//     }
// };

const sendErrorProd = (err, req, res) => {//This is written AFTER folder 12 video 20
    //API
    if(req.originalUrl.startsWith('/api')) {//app.use('/api/v1/
        //liat di app.js bagian mounting routes
        // Operational, trusted error: send message to client
        if (err.isOperational) {
            console.log(err);
            res.status(err.statusCode).json({
                status: err.status,
                message: err.message
        });
    
        // Programming or other unknown error: don't leak error details
        } else {
        // 1) Log error
            console.error('UNEXPECTED ERROR 💥', err);
    
        // 2) Send generic message
        res.status(500).json({
            status: 'error',
            message: 'Something went very wrong!'
        });
        }

    } else {

    //RENDERED WEBSITE    
        if (err.isOperational) {
            console.log(err);
            res.status(err.statusCode).render('error', {//app.use('/', viewRouter);
            //liat di app.js bagian mounting routes

            title: 'Something went wrong',
            msg: err.message
            });
        // Programming or other unknown error: don't leak error details
        } else {
        // 1) Log error
            console.error('UNEXPECTED ERROR 💥', err);
    
        // 2) Send generic message
            res.status(err.statusCode).render('error', {//app.use('/', viewRouter);
            //liat di app.js bagian mounting routes

                title: 'Something went wrong',
                msg: 'Try again later'
            });
        }
    }
    
};

module.exports = (err, req, res, next) => {//this four arguments will automatically recognized by express as error handling middleware
    //console.log(err.stack);//we preserve this stack tracking error into the appError.js

    err.statusCode = err.statusCode || 500;//ini kita define dulu default error status code nya
        //err.statusCode is equal err.statusCode if it is defined or 500
    
    err.status = err.status || 'error'; 

    if(process.env.NODE_ENV === 'development') {//when in development reveal many errof information to client
        
        console.log('abe development error. dari errorController.js');
        //sendErrorDev(err, res);//This is written BEFORE folder 12 video 20
        sendErrorDev(err, req, res);//This is written AFTER folder 12 video 20

    } else if(process.env.NODE_ENV = 'production') {//when in production reveal little error information to client
        
        console.log('abe production error. dari errorController.js');
        let error = Object.create(err);//ini dari assistent jonas, tapi tanpa ditambah code error.name = err.name;
        //let error = { ...err };//ini yg asli dari jonas
        //error.name = err.name;//tapi harus ditambahi code yg ini
        // error.message = err.message
        console.log(error.message, ', HALO');
        console.log(err.message, ', BIBI');

        if(error.name === 'CastError') error = handleCastErrorDB(error);
            //or if(error.name === 'CastError')


        if(error.code === 11000) error = handleDuplicateFieldsDB(error);

        if(error.name === 'ValidationError') error = handleValidationErrorDB(error);

        if(error.name === 'JsonWebTokenError') error = handleJWTError();

        if(error.name === 'TokenExpiredError') error = handleJWTExpiredError();
          
            
        //sendErrorProd(error, res);//This is written BEFORE folder 12 video 20 
        sendErrorProd(error, req, res);//This is written AFTER folder 12 video 20 

        // let error = { ...err };
        // error.name = err.name;
        // if (error.name === 'CastError') error = handleCastErrorDB(err);
        // sendErrorProd(err, res);
    }
}; 