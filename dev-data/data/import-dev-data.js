//disini file tempat dimana kita import data
//these all files in here gonna run once only in the beginning. makanya maka readfilesync bukan readfile async


const fs = require('fs');//need file system module in order to read json file
const mongoose = require('mongoose');

const dotenv = require('dotenv');//ini enviroment database in order to connect to database
dotenv.config({ path: './config.env' });

const Tour = require('./../../models/tourModel');//need tour model where we want to write the tours
const User = require('./../../models/userModel');//need tour model where we want to write the tours
const Review = require('./../../models/reviewModel');//need tour model where we want to write the tours

const DB = process.env.DATABASE.replace('<PASSWORD>', process.env.DATABASE_PASSWORD);

mongoose.connect(process.env.DATABASE_LOCAL, {
//mongoose.connect(DB, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false
}).then(() => console.log('DB connections succesful! dari import-dev-data.js'));

//READ JSON FILE
const tours =  JSON.parse(fs.readFileSync(`${__dirname}/tours.json`, 'utf-8'));
const users =  JSON.parse(fs.readFileSync(`${__dirname}/users.json`, 'utf-8'));
const reviews =  JSON.parse(fs.readFileSync(`${__dirname}/reviews.json`, 'utf-8'));
    //aslinya begini (`./tours-simple.json`, 'utf-8')<< tapi ini error
    //penjelasan jonas: this dot here is relative from the folder where node application is started, so thats the home folder
    //ini harus di convert dulu ke javascript object dgn method JSON.parse()

//IMPORT DATA INTO DB
const importData = async () => {
    try {
        await Tour.create(tours);
        await User.create(users, { validateBeforeSave: false });
        await Review.create(reviews);
        console.log('Data successfully loaded dari import-dev-data.js');

    } catch (err) {
        console.log(err);
    }

    process.exit();
};

//DELETE ALL DATA FROM DB
const deleteData =  async () => {//mongoose jg punya akses ke bbrp method seperti ini kyk mongodb
    try {
        await Tour.deleteMany();
        await User.deleteMany();
        await Review.deleteMany();
        console.log('Data successfully deleted dari import-dev-data.js');

    } catch (err) {
        console.log(err);
    }

    process.exit();
};

if(process.argv[2] === '--import') {
    importData();

} else if(process.argv[2] === '--delete') {
    deleteData();
}

//tulis begini di terminal klo mau impord-delete data manually
// node dev-data/data/import-dev-data.js --import
// node dev-data/data/import-dev-data.js --delete