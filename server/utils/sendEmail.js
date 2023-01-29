const nodemailer = require("nodemailer");

const sendEmail = async (subject, message, sent_from, send_to, reply_to) => {
  //create email transporter
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: 587,
    secure:false,
    logger: true,
    debug: true,
    secureConnection: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    },
    //add tls properties to mitigate any issue
    tls: {
      rejectUnauthorized: false,
    },
  });

  //options for sending email
  const options = {
    from: sent_from,
    to: send_to,
    replyTo: reply_to,
    subject: subject,
    html: message,
  };

  await transporter.sendMail(options,function(err,info){
if(err){
    console.log(err);
}else{
    console.log(info);
}
  })
};

module.exports = sendEmail;
