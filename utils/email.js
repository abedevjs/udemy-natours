const nodemailer = require('nodemailer');//hrs install npm i nodemailer
const pug = require('pug');
const htmlToText = require('html-to-text');//This converting all the HTML to simple text, stripping out all of the HTML leaving only the content

//The idea is new Email(user, url).sendWelcome();
module.exports = class Email {
    constructor(user, url) {
        this.to = user.email;
        this.firstName = user.name.split(' ')[0];
        this.url = url;
        this.from = `Jonas Schmedtmann <${process.env.EMAIL_FROM}>`;
    }

    newTransport() {
        if(process.env.NODE_ENV = 'production') {
            
            //Sendgrid
            return nodemailer.createTransport({
                service: 'SendGrid',//wkt registrasi pake email perusahaan, jgn gmail
                port: process.env.EMAIL_PORT,//klo sendgrid 587
                auth: {
                    user: process.env.SENDGRID_LOGIN,
                    pass: process.env.SENDGRID_PASSWORD
                }
            })
        }

        return nodemailer.createTransport({
            //service: 'Gmail',
            host: process.env.EMAIL_HOST,
            port: process.env.EMAIL_PORT,//klo mailtrap di port 25
            auth: {
                user: process.env.EMAIL_USERNAME,
                pass: process.env.EMAIL_PASSWORD
            }
    
            //Then youhave to activate in gmail "less secure app option"
        });
    }

    async send(template, subject) {//Broad Function of sending email

        //1. Render HTML based on pug template
            //res.render('')//What this does is to basically create the HTML based on the pug template, and send it to the client
                //is not gonna be working like this
        //All we want to do is basically create the HTML out of the template so that we can send the HTML as the email
        //so basically defining it in const mailOptions as an HTMl options
        //and mainly we are interested in sending an HTML email
        //so thats why we gonna have a pug template from which we will generate this HTML
        const html = pug.renderFile(`${__dirname}/../views/emails/${template}.pug`, {
            firstName: this.firstName,
            url: this.url,
            subject
        });
            //${__dirname} < is the location of the currently running script, 
            //so that is right now, at the utilities folder

        //2. Define email options
        const mailOptions = { 
            from: this.from,
            to: this.to,
            subject,
            html,
            text: htmlToText.fromString(html)//Important for email delivery rates and spam folder
        };

        //3. Create a transport and send email
        await this.newTransport().sendMail(mailOptions);//this returns promise
        console.log('email sent dari utils/email.js');
    }

    async sendWelcome() {//One different options for each type of email 
        await this.send('welcome', 'Welcome to the Natours family!');
    }

    async sendPasswordReset() {
        await this.send('passwordReset', 'Your password reset token (valid for only 10 minutes)');
    }
};


// const sendEmail = async options => {
//     //1. Create a transporter
//     const transporter = nodemailer.createTransport({
//         //service: 'Gmail',
//         host: process.env.EMAIL_HOST,
//         port: process.env.EMAIL_PORT,
//         auth: {
//             user: process.env.EMAIL_USERNAME,
//             pass: process.env.EMAIL_PASSWORD
//         }

//         //Then youhave to activate in gmail "less secure app option"
//     });

//     //2. Define the email options
//     const mailOptions = { 
//         from: 'Abe <hello@abe.com>',
//         to: options.email,
//         subject: options.subject,
//         text: options.message
//         //html:
//     }

//     //3. Send email to user
//     await transporter.sendMail(mailOptions);//this returns promise
// };

// module.exports = sendEmail;