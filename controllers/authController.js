//Authentication Controller
//di file js yg ini tempat dimana  .....

const crypto = require('crypto');
const { promisify } = require('util')
const jwt = require('jsonwebtoken');//stateless authentication
const User = require('./../models/userModel');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/AppError');
const Email = require('./../utils/email');
// const sendEmail = require('./../utils/email');

const signToken = id => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {//parameternya(payload, secret, options1)
        expiresIn: process.env.JWT_EXPIRES_IN
    });
}

const createSendTOken = (user, statusCode, res) => {

    const token = signToken(user._id);
    const cookieOptions = {
        expires: new Date(Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 *60 * 1000),//ini cara reset days hingga ke millisecond
        httpOnly: true
    };

    if(process.env.NODE_ENV === 'production') cookieOptions.secure = true;

    res.cookie('jwt', token, cookieOptions);//argumennya (nama cookie, yg dikirim, options)

    user.password = undefined;//remove the password from the output

    res.status(statusCode).json({
        status: 'success',
        token,
        data: {
            user
        }
    });
}

exports.signup = catchAsync(async (req, res, next) => {//127.0.0.1:3000/api/v1/users/signup
    const newUser = await User.create({
        name: req.body.name,
        email: req.body.email,
        role: req.body.role,
        password: req.body.password,
        passwordConfirm: req.body.passwordConfirm,
        passwordChangedAt: req.body.passwordChangedAt
    });

    const url = `${req.protocol}://${req.get('host')}/me`;
        //When we'r in development,${req.get('host') < this will be the local host on port 3000
    
    console.log('INI URL NYA:', url);
    
    await new Email(newUser, url).sendWelcome();//krn sendWelcome di email.js adalah async

    createSendTOken(newUser, 201, res);
    console.log('sign up done. dari authController export.signup');
});

exports.login =  catchAsync(async (req, res, next) => {//127.0.0.1:3000/api/v1/users/login
    const { email, password } = req.body;//ini cara destructuring dari es6 


    //1. Check if email and password exist
    if(!email || !password) {//if there is no email OR password
        return next(new AppError('Please provide email and password', 400));//400 Bad Request
    }

    //2. Check if user exists && password is correct
    const user = await User.findOne({ email }).select('+password');//karena password ini di select: false di userSchema
        //Tapi disini kita butuh password untuk ngecek password
        //Maka kita pake method select('+namaField')
    
    //const correct = await user.correctPassword(password, user.password);//Disini kita mau memakai function correctPassword yg adalah instance method
        //krn instance method ini available di all user document, maka bisa kita langsung pakai disini
        //correctPassword ini function async-await, jd kita async-await jg

    if(!user || !(await user.correctPassword(password, user.password))) {//if there is no user OR there is no correct atau pasword is incorrect
        return next(new AppError('Incorrect email or password', 401));//401 means unauthorized
    }

    //3. If everything ok, send token to client
    createSendTOken(user, 200, res);
});

exports.logout = (req, res) => {
    res.cookie('jwt', 'loggedout', {//This send back cookie that we sent when logout, is a dummy text will override the secure logged in cookie
        //parameter nya (nama cookie, cookie, options dalam object)
        expires: new Date(Date.now() + 5 * 1000), //10s
        httpOnly: true
    });
    res.status(200).json({ status: 'success'});
}

exports.protect =  catchAsync(async (req, res, next) => {//this middleware for checking if the user is logged in with some verification examined in it
    //1. Get the token and check if it is exist
    let token;

    if(req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        //kita bisa pake startsWith karena req.headers.authorization adalah string
        token = req.headers.authorization.split(' ')[1];//Bearer idtokensignature
    } else if(req.cookies.jwt) {
        token = req.cookies.jwt;
    }

    if(!token) {//if there is no token
        return next(new AppError('You are not logged in, please login to get access', 401));
    }

    //2. Verification the token if someone has manipulated the data or has expired
    const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);//this verify() is actually a async function
    
    //3. Check if user still exists
    const currentUser = await User.findById(decoded.id);//the id has taken from id that we set in token payload
    if(!currentUser) {//if there is no currentUser
        return next(new AppError('The user with this token does not longer exist', 401))
    }

    //4. Check if user changed password after the token was issued
        //This is an instance method
    if(currentUser.changedPasswordAfter(decoded.iat)) {//iat issued at, tanggal di terbitkannya token. jika true
        return next(new AppError('User recently changed password, please login again', 401));
    }

    //5. If everything ok, we give you grant access, you shall pass now. But before we take your req.user to next middleware
    req.user = currentUser;//put the entire user data on the request
        //this req.user this is the one that travels from middleware to middleware
        //if we want to pass data from one middleware to the next one, then we can simply put some stuff in the request object and then that data will be available at a later point

    res.locals.user = currentUser//Kita kasih user header template
        //the word 'user' is just a name variable connected to _header.pug
        //where user is acting like a parameter which will be executed in that template
        //res.locals.user ini cari menempatkan argumen di pug template, jadi sperti res.locals(user)
    next();
});

exports.isLoggedIn =  async (req, res, next) => {//this middleware for checking if the user is logged in
        //if he is logged in then in the end they get logged in user pug template.
        //no errors in this middleware

    try {
        if(req.cookies.jwt) {//for rendered pages, we will not have token from the header that one only for API       
            console.log('The user has cookie');
            //1. Verification the token if someone has manipulated the data or has expired
            const decoded = await promisify(jwt.verify)(req.cookies.jwt, process.env.JWT_SECRET);//this verify() is actually a async function
            
            //2. Check if user still exists
            const currentUser = await User.findById(decoded.id);//the id has taken from id that we set in token payload
            if(!currentUser) {//if there is no currentUser
                return next();
            }
    
            //3. Check if user changed password after the token was issued
                //This is an instance method
            if(currentUser.changedPasswordAfter(decoded.iat)) {//iat issued at, tanggal di terbitkannya token. jika true
                return next();
            }
    
            //4. If there is a logged in user, we give you this special logged in user pug template
            res.locals.user = currentUser//the word 'user' is just a name variable connected to _header.pug
                //where user is acting like a parameter which will be executed in that template
                //res.locals.user ini cari menempatkan argumen di pug template, jadi sperti res.locals(user)
            
            return next();
        }
    } catch (err) {
        return next();
    }

    console.log('The user does not have cookie');
    next();
};

exports.restrictTo = (...roles) => {//middleware doest not receive argument other than (req, res, next), so we create a wrapper function.
    //(...roles) < rest parameter syntax, this will create an array of argument that where specified
    return (req, res, next) => {//we create a wrapper function and then return it directly to middleware function
        //roles is an array ['admin', 'lead-guide', 'guide', 'user']
        if(!roles.includes(req.user.role)) {//req.user.role ini bawaan dari middleware sebelumnya yaitu exports.protect
            //if req.user.role does not include in roles (admin, lead-guide)
            return next(new AppError('You do not have permission to perform this action', 403));//403 forbidden
        }

        next();
    }
};

exports.forgotPassword =  catchAsync(async (req, res, next) => {//127.0.0.1:3000/api/v1/forgotPassword
    //1. Get user based on posted email
    const user = await User.findOne({ email: req.body.email });
    if(!user) {//if there is no user
        return next(new AppError('There is no user with this email address', 404));//404 not found
    }

    //2. Generate the random signToken. Pake instance method yg available dipake utk seluruh user document
    const resetToken = user.createPasswordResetToken();
        //ini utk nge save passwordResetExpired di user field krn dy di execute dlm instance method createPasswordResetToken
        
    await user.save({ validateBeforeSave: false });//klo ga di save({ validateBeforeSave: false }), nnti akan muncul error: validator error dari field user yg kita mark required
        //ini akan deactivate all the validators in userSchema

    try {
        //3. Send it to user's email
        const resetURL = `${req.protocol}://${req.get('host')}/api/v1/users/resetPassword/${resetToken}`;

        //const message = `Forgot your password? Submit a PATCH request with your new password and passwordConfirm to: ${resetURL}\nIf you didnt forget your password, please ignore this email.`;

        // await sendEmail({//this is await because sendEmail is an async function
        //     email: user.email,//or email: req.body.email
        //     subject: 'Your password reset token (valid for 10 min)',
        //     message
        // });

        await new Email(user, resetURL).sendPasswordReset();
    
        res.status(200).json({
            status: 'success',
            message: 'Token sent to email'
        });
    } catch(err) {
        //console.log(err);
        user.passwordResetToken =  undefined;
        user.passwordResetExpires = undefined;
        await user.save({ validateBeforeSave: false });//klo ga di save({ validateBeforeSave: false }), nnti akan muncul error: validator error dari field user yg kita mark required
        //ini akan deactivate all the validators in userSchema

        return next(new AppError('There was an error sending the email. Please try again later!', 500));
            //500 is an error that is happening on the server
    }
    
                        
});

exports.resetPassword =  catchAsync(async (req, res, next) => {//127.0.0.1:3000/api/v1/resetPassword/:token
    //1. Get user based on the token
    const hashedToken =crypto.createHash('sha256').update(req.params.token).digest('hex');

    const user = await User.findOne({ passwordResetToken: hashedToken, passwordResetExpires: { $gt: Date.now()} } );
        //ini untuk ngecek apakah passwordResetToken di database dan token user yg sdh jd hashed token sama
        //jg untuk ngecek apakah passwordResetExpires lebih besar dari wkt skrg
        //ini mongodb method

    //2. If token has not expired, and there is a user...set the new password
    if(!user) {
        return next(new AppError('Token is invalid or has expired', 400));//bad request
    }

    //we will ofcourse send password and passwordConfirm via body
    user.password = req.body.password;
    user.passwordConfirm = req.body.passwordConfirm;
    user.passwordResetToken =  undefined;//ini utk me-reset property passwordResetToken
    user.passwordResetExpires =  undefined;//ini utk me-reset property passwordResetExpires
    await user.save();//tanpa save({ validateBeforeSave: false }),validator nya active lagi

    //3. Update changedPasswordAt property for the currentUser
    

    //4. log the user in, send JWT
    createSendTOken(user, 200, res);
});

exports.updatePassword =  catchAsync(async (req, res, next) => {//{{URL}}api/v1/users/updateMyPassword
    //for already logged in user
    //1. Get user from collection
    const user = await User.findById(req.user.id).select('+password');// check if his current password is correct
        //karena aslinya field password ga showup pake select method, jd klo mau di showup kan dikasi + jadi select('+pasword)

    //2.  Check if posted current password is correct Password
    if(!(await user.correctPassword(req.body.passwordCurrent, user.password))) {//ini dalam triple dalam kurung karena kita call method correctPassword dari usermodel
        //harus di await karen correctPassword adalah async function
        return next(new AppError('Your current password is wrong', 401));//unauthorized
    }
    
    //3. If so, update password
    user.password = req.body.password;
    user.passwordConfirm = req.body.passwordConfirm;
    await user.save();//kita ga pake findByIdAndUpdate karena validator save password ini hanya berlaku di create new user bukan update

    //4. Give token
    createSendTOken(user, 200, res);
});