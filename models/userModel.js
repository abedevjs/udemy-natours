//di file js yg ini tempat dimana bnyak di define respon dari permintaan client tentang user
//keep fat models, thin controllers

const crypto = require('crypto');//Untuk random bytes function, hash/encrypt versi ringan. Ini sudah built-in node jd ga perlu install
const mongoose = require('mongoose');//Mongoose ini layout modelnya MongoDB
const validator = require('validator');
const bcrypt = require('bcryptjs');//Untuk hash password

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please tell us your name']
    },
    email: {
        type: String,
        required: [true, 'Please provide your email'],
        unique: true,
        lowercase: true,
        validator: [validator.isEmail, 'Please provide a valid email']//validator.isEmail sdh ter built in di validator npm. Jadi search aja built-in function lainnya
    },
photo: {
    type: String,
    default: 'default.jpg'
},
    role: {
        type: String,
        enum: ['admin', 'lead-guide', 'guide', 'user'],
        default: 'user'
    },
    password: {
        type: String,
        required: [true, 'Please provide a password'],
        minlength: 8,
        select: false //biar ga show up in any output
    },
    passwordConfirm: {
        type: String,
        required: [true, 'Please confirm your password'],//ini maksudnya required input, bukan required persisted/tersimpan di database, karena nnti akan di hapus di pre hook  document middleware
        validate: {//This only works on CREATE and SAVE !!! not UPDATE (POST)
            validator: function(el) {
                return el === this.password;//This.password refers to this document that currently being created or saved
            },
            message: 'Passwords are not the same'
        }
    },
    passwordChangedAt: Date,
    passwordResetToken: String,
    passwordResetExpires: Date,
    active: {
        type: Boolean,
        default: true,
        select: false
    }
});


//1.Mongoose Middleware, berfungsi untuk password encryption, yang terexecute sebelum sebuah document di create atau di save(update).
//This only works on CREATE and SAVE !!! not UPDATE (POST)
userSchema.pre('save', async function(next) {//this runs if password actually modified
    if(!this.isModified('password')) return next();//if the password has not been modified, return next()

    //hash the password with cost of 12
    this.password = await bcrypt.hash(this.password, 12);//angka 12 untuk tingkat kesulitan encrypt. klo terlalu tinggi, komputer yg jd lelet utk proses

    //delete the passwordConfirm field
    this.passwordConfirm = undefined;//biar ngga persisted/tersimpan di database

    next();
});

userSchema.pre('save', function(next) {//ini utk me-update passwordChangedAt property jika sblmnya user sdh ganti forget pass atau ganti pass
    //gonna run right before a new document is gonna saved
    //This only works on CREATE and SAVE !!! not UPDATE (POST)

    if(!this.isModified('password') || this.isNew) return next();//if we didnt modify the password property OR the document is new then next

    this.passwordChangedAt = Date.now() - 1000;//ini biar lebih lambat ter rekam 1s, sebelum token terbit

    next();
});

userSchema.pre(/^find/, function(next) {//ini query middleware, active saat query di search dgn any keyword find
    // /^find/ is a regular expression means any keywords start with find ex: findById find dll
    //this point to current query

    this.find({ active: { $ne: false } });
    
    next();
})

//Ini function untuk ngecek wkt user login apakah passwordnya benar
userSchema.methods.correctPassword = async function(candidatePassword, userPassword) {//ini instance method. userSchema.methods is always a instanc method
    //adalah method yang tersedia di all of user document of collection
    //disebut instances krn document adalah instance dari model
    // this.password < normalnya bisa begini, krn this refers to this document
    //tapi karena di userSchema password select: false, jd pake cara lain

    return await bcrypt.compare(candidatePassword, userPassword);//ini utk memvalidasi password
        //function ini hasilnya true or false

};

userSchema.methods.changedPasswordAfter = function(JWTTimestamp) {//this function checks whether user has change password after token is issued
    if(this.passwordChangedAt) {//passwordChangedAt exists, meaning user has ever changed password
        const changedTimestamp = parseInt(this.passwordChangedAt.getTime() / 1000, 10);//converts to from date to millisecond

        //console.log(this.passwordChangedAt, JWTTimestamp);//2020-12-22T00:00:00.000Z 1607844598
        //console.log(changedTimestamp, JWTTimestamp);//1608595200 1607844598
        //JWTTimestamp tanggal dikeluarkannya token
        //changed time stamp tanggal setelah dikeluarkan token baru

        return JWTTimestamp < changedTimestamp;
    }

    return false;//meaning user never change password
};

userSchema.methods.createPasswordResetToken = function() {
    const resetToken = crypto.randomBytes(32).toString('hex');//32 itu jumlah character yg di create. ('hex') itu jenis characternya
        //ini sebelum ter encrypt di send ke user email

    this.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');//resetToken di hash barulah boleh kita simpan di database.
        //ini resetToken yg sdh di encrypt tersimpan di database
        //jangan simpan sensitive information dalam bentuk plain text di database, encrypt dulu

    this.passwordResetExpires = Date.now() + 10 * 60 * 1000;//10 * 60 * 1000 < ini cara convert 10 menit dalam millisecond
        //10 * 60 second * 1000 milliseconds

        //console.log({resetToken}, this.passwordResetToken);

    return resetToken;//jgn lupa, yg kita send (via email) ke user itu unencrypted yg blm ter encrypt reset token
        //yg kita simpan di database encrypted resetToken untuk kemudian di check dgn cara di compare
};

const User = mongoose.model('User', userSchema);

module.exports = User;