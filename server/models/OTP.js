const mongoose = require('mongoose');
const mailSender = require('../utils/mailSender');
const emailTemplate = require("../mail/templates/emailVerificationTemplate");
const OTPSchema = new mongoose.Schema({
    
    email: {
        type:String,
        required:true,
    },
    otp: {
        type:String,
        required:true,
    },
    createdAt: {
        type:Date,
        default:Date.now(),
        expires:60*60*5*1000,
    }, 
    

});

//Function To send a Email
async function sendVerificationEmail(email, otp){
    try{
        const mailResponse = await mailSender(
            email, 
            "Verification Email from CodexLab", 
            emailTemplate(otp)
        );
        console.log("Email sent Successfully: ", mailResponse.response);
    }
    catch(error){
        console.log("Error occured while sending mails: ", error);
        throw error;
    }
}

// Define a post-save hook to send email after the document has been saved
OTPSchema.pre("save", async function(next){
    console.log("New document saved to database");
    if(this.isNew){
        await sendVerificationEmail(this.email, this.otp);
    }
    next();
})

module.exports = mongoose.model("OTP", OTPSchema);

