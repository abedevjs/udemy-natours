//di file js yg ini tempat dimana root/settingan mongodb di bentuk
//When in production mode the interaction between server n client should be ini https for security sake
const mongoose = require('mongoose');
const dotenv = require('dotenv');//ini enviroment database in order to connect to database

process.on('uncaughtException', err => {//ini utk menghandle synchronous code yg blm terhandle
    console.log('uncaughtException, shutting down...abe dari server.js');
    console.log(err.name, err.message);
    console.log(err);
    process.exit(1);
});

dotenv.config({ path: './config.env' });

const app = require('./app');

const DB = process.env.DATABASE.replace('<PASSWORD>', process.env.DATABASE_PASSWORD);

mongoose.connect(process.env.DATABASE_LOCAL, {
//mongoose.connect(DB, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false
}).then(() => console.log('DB connections succesful! file server.js'));

//console.log(process.env);
const port = process.env.PORT || 3000;
const server = app.listen(port, () => {
    console.log(`App running on port ${port}...`);
});

//a safety net, menghandle any error somewhere in our app, error yg blm terhandle
process.on('unhandledRejection', err => {//ini utk menghandle asynchronous code yg blm terhandle
    //console.log(err.name, err.message);
    console.log('Unhandled Rejection, shutting down... abe dari server.js');
    server.close(() => {//dgn cara server.close(), kita akan memberikan waktu kpd app untuk shutting down perlahan dgn menyelesaikan promises
        process.exit(1);
    })
});