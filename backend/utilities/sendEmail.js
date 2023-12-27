const nodeMailer = require("nodemailer")

const sendEmail = async (subject, message, sendTo, sentFrom, replyTo) => {

    //create email transporter
    const transporter = nodeMailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: 587,
        auth: {user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS},
        tls: {rejectUnauthorized: false}
    })

    //create options
    const options = {
        from: sentFrom,
        to: sendTo,
        replyTo: replyTo,
        subject: subject,
        html: message
    }

    //send email
    transporter.sendMail(options, function (err, info){
        if (err) { 
            console.log(err)
        } else {
            console.log(info)
        }
    })
}

module.exports = sendEmail