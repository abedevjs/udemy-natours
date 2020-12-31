class AppError extends Error {//extends the already built-in Error class
    constructor(message, statusCode) {
        //contoh nya  next(new appError(`This route is unavailable`, 404));

        super(message);//here we call the parent
            //the message is actually the only parameter that the built-in error accepts
            //this is basically like calling error

        this.statusCode = statusCode;
        this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
        this.isOperational = true;//utk memastikan ini this whole class that we create buat operational error bukan programming error

        Error.captureStackTrace(this, this.constructor);
            //will basically show us where the error happen
    }
}

module.exports = AppError; 