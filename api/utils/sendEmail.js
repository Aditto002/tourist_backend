import { text } from 'express'
import nodemailer from 'nodemailer'

import dotenv from 'dotenv'
dotenv.config()
export const SendEmailUtils = async (EmailTo, EmailText, EmailSubject)=>{
    let transporter = nodemailer.createTransport({
        //from where to send email
        //this is for gmail, we can use yahoo mail or any smtp provider
        service: 'gmail',
        port: 465,
        secure: true,
         logger: true,
         debug: true,
        auth: {
            //user: process.env.EMAIL, //my email address
            user: "cse_2112020025@lus.ac.bd",
            //pass: process.env.EMAIL_PASSWORD //my email address password
            pass: "Helloaditto2025",
        },
        tls: {
            rejectUnauthorized: true
        }
    });


    // send mail with defined transport object
    let mailOptions = {

        from: '"ExploreConnect" <cse_2112020025@lus.ac.bd>',//first part is the email headline and in <> we use our email address
        to: EmailTo, // list of receivers
        subject: EmailSubject, // Subject line
        text: EmailText, // plain text body
    };

    //send mail
    return await transporter.sendMail(mailOptions);
}

