const bcrypt = require("bcrypt");
const User = require("../models/User");
const mailSender = require("../utils/mailSender");
const crypto = require("crypto");

//--------------reset forget PasswordToken-------------------
exports.resetPasswordToken = async (req, res) =>{
    try{
        //get email from req, body
        const {email} = req.body;

        // check user for this email & validate user
        const user = await User.findOne({email: email});
        if(!user){
            return res.json({
				success: false,
				message: `This Email: ${email} is not Registered With Us Enter a Valid Email `,
			});
        }

        // generate token
        const token = crypto.randomBytes(20).toString("hex");

        // update user by adding token and expiration time
        const updatedDetails = await User.findOneAndUpdate(
            {email: email}, 
            {
                token: token, 
                resetPasswordExpires:Date.now() + 3600000,
            },
            {new:true}
        );
        console.log("Details:-", updatedDetails);

        // create url 
        const url = `http://localhost:3000/update-password/${token}`;

        // send mail containing the URL
        await mailSender(
            email,
            "Password Reset Link",
            `Password Reset Link: ${url}.  Please click this url to reset your password.`
        );

        // return res
        return res.json({
            success:true, 
            message: "Email sent successfully, Please check email and change password",
        });

    }
    catch(error){
        console.log(error);
        return res.json({
			error: error.message,
			success: false,
			message: `Some Error in Sending the Reset Message`,
		});
    }
}


//---------------------resetPassword---------------------
exports.resetPassword = async (req, res) =>{
    try{
        // data fetch
        const {token, password, confirmPassword} = req.body;
        
        // validation
        if(!password || !confirmPassword){
            return res.json({
                success:false,
                message:"All fields are required",
            });
        }
        if(password!=confirmPassword){
            return res.json({
                success:false,
                message: "Password does not match",
            });
        }

        // get user details from DB using token
        const userDetails = await User.findOne({token:token});

        // if no entry- invalid token
        if(!userDetails){
            return res.json({
                success:false,
                message:"User does not found!. Invalid token",
            });
        }

        // token time check
        if(!(userDetails.resetPasswordExpires > Date.now())){
            return res.status(403).json({
				success: false,
				message: `Token is Expired, Please Regenerate Your Token`,
			});
        }

        // hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // password update
        await User.findOneAndUpdate(
                {token:token}, 
                {password:hashedPassword}, 
                {new:true}
        );

        // return response
        res.json({
			success: true,
			message: `Password Reset Successful`,
		});
    }
    catch(error){
        console.log(error);
        return res.status(500).json({
            success:false,
            message:"Something went wrong while sending rest password mail",
        });
    }
}

