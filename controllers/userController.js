const catchAsync = require('../utils/catchAsync');
const multer= require('multer');//Is a middleware for multi-part form data
const User = require('./../models/userModel');
const Apperror = require('./../utils/appError');
const factory = require('./handlerFactory');
const sharp = require('sharp');//Image processing library for nodeJs. npm i sharp

// const multerStorage = multer.diskStorage({//How we want to store our file.
//     destination: (req, file, cb) => {//this is here to define the destination. this property name from multer
//         //takes 3 argument current request, currently uploaded file, callback function
//         //this cb function is like next in express

//         cb(null, 'public/img/users');
//             //first argument is error if error, and if valid is null
//             //second argument is the location where u want the file to be stored
//     },

//     filename: (req, file, cb) => {//this is here to define the filename. this property name from multer

//         //user-userId-currenttimestamp.jpeg
//         //user-564ssg12-120211.jpeg
//         //mimetype: 'image/jpeg'; ini isi dari req.file
//         const ext = file.mimetype.split('/')[1];//jpeg
//         cb(null, `user-${req.user.id}-${Date.now()}.${ext}`);
//             //first argument is error if error, and if valid is null
//             //second argument is the how you name your file
//             //${req.user-id} is logged in user id

//     }
// });

const multerStorage = multer.memoryStorage();//This way, the image will be stored as a buffer
    //karena kita mau resize jadi ini ter save dulu di memory, terus dari resizeUser kita read image tsb
    //barulah setelah resize kita save di disk

const multerFilter = (req, file, cb) => {//How to filter the upload file
    if(file.mimetype.startsWith('image')) {//Is basically to test if it's an image
        //We also can filter for only csv or mp3 or png or anyother file
        cb(null, true);
    } else {
        
        cb(new Apperror('Not an image, please upload only images', 400), false);//400 bad request
    }
};

const upload = multer({//all these property name are from multer
    storage: multerStorage,
    fileFilter: multerFilter
});

exports.uploadUserPhoto = upload.single('photo');
    //Upload adalah an already built-in middleware from multer
    //single < krn kita upload 1 photo
    //'photo' jg field disini adalah nama form tempat kita upload photo di web body

exports.resizeUserPhoto = catchAsync(async (req, res, next) =>{ 
    if(!req.file) return next();

    req.file.filename = `user-${req.user.id}-${Date.now()}`;

    await sharp(req.file.buffer)
        .resize(500, 500)
        .toFormat('jpeg')
        .jpeg({ quality: 90 })
        .toFile(`public/img/users/${req.file.filename}`)

    next();
});

const filterObj = (obj, ...allowedFields) => {//funtion ini utk filter allowed fields dalam sebuah objek
    //jd ini utk membatasi field2 mana saja yg boleh masuk dalam newObj
   //...allowedFields < adalah cara utk menulis klo argumen disini adalah elemen2 array
   //all we do here is basically loop through all the fields in the obj, 
        //and for the each fields we check if it's one of the allowedFields
        //and if is then we create a new field in the newObj of course with the same name (el)
        //with the exact same value as it has in the original object (Userschema object)
   
   const newObj = {};

   Object.keys(obj).forEach(el => {//Object.keys(obj) < this will return the object of the key names

       if(allowedFields.includes(el)) newObj[el] = obj[el];
       //if the allowed fields array includes the current element/the current field name,
       //then we want to add that to newObj
       //newObj(el) = obj(el); < newObj with the field name of the current field should be equal to whatever is in the object of the current element (obj)
   })
   
   return newObj;
};

exports.getAllUsers = factory.getAll(User);

// exports.getAllUsers = catchAsync( async (req, res, next) => {
//     const users = await User.find();
        
//     //WE SEND THE RESPONSE
//     res.status(200).json({
//         status: 'success',//fail(to client), error(to server)
//         //requestedAt: req.requestTime,
//         results: users.length,
//         data: {
//             users// tours: tours
//         }
//     });
// });

exports.getMe = (req, res, next) => {//Utk retrieve data pribadi user
    req.params.id = req.user.id;
    
    next();
}

exports.updateMe = catchAsync( async (req, res, next) => {//{{URL}}api/v1/users/updateMe
    //hanya untuk name, email, bukan untuk password jd kita pakai findByIdAndUpdate

    // console.log(req.file);//file itu photo
    // console.log(req.body);

    //1. Create an error if user POSTs password data
    if(req.body.password || req.body.passwordConfirm) {
        return next(new Apperror('This route not for update password, use /updateMyPassword', 400));//bad request
    }

    //2. Filtered out unwanted fields name that are not allowed to be updated. ex: role: admin
    const filteredBody = filterObj(req.body, 'name', 'email');
    if(req.file) filteredBody.photo = req.file.filename;

    //3. Update user document
    const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredBody, { new: true, runValidators: true });
        //variabel ini hanya nge save data fields yg di isi/update oleh user. misal user hanya update nama saja atau email sj
        //{new: true} < adalah konfirmasi ini adalah new data field dari object ini
        //{runValidators: true} < konfirmasi utk required field di aktifkan

    res.status(200).json({
        status: 'success',
        data: {
            user: updatedUser
        }
    })
});

exports.deleteMe = catchAsync( async (req, res, next) => {//{{URL}}api/v1/users/deleteMe
    //we do not delete user, we make it inactive

   await User.findByIdAndUpdate(req.user.id, { active: false })

   res.status(204).json({//204 no content
        status: 'success',
        data: null
   })
});

exports.createUser = (req, res) => {
    res.status(500).json({
        status: 'error',
        message: 'This createUser route is not yet defined! Please use signup instead'
    });
};

exports.getUser = factory.getOne(User);

exports.updateUser = factory.updateOne(User);//bukan termasuk utk update password

exports.deleteUser = factory.deleteOne(User);