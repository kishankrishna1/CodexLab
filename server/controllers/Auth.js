const User = require("../models/User");
const OTP = require("../models/OTP");
const otpGenerator = require("otp-generator");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const Profile = require("../models/Profile");
const { passwordUpdated } = require("../mail/templates/passwordUpdate");
const mailSender = require("../utils/mailSender");
require("dotenv").config();

//----------sendOTP--------------------------
exports.sendotp =  async(req, res) =>{
    try{
        //fetch email from request body
        const {email} = req.body;

        //check if user already exist
        const checkUserpresent = await User.findOne({email});

        //if user already exit then return a response
        if(checkUserpresent){
            return res.status(401).json({
                success:false,
                message:'User already registered',
            });
        }

        //generate otp
        let otp = otpGenerator.generate(6, {
            upperCaseAlphabets:false,
            lowerCaseAlphabets:false,
            specialChars:false,
        });
        console.log("OTP generated: ", otp);
 
        //check unique otp or not
        const result = await OTP.findOne({otp:otp});


        while(result){
            otp = otpGenerator(6,{
                upperCaseAlphabets:false,
                lowerCaseAlphabets:false,
                specialChars:false,
            });
            result = await OTP.findOne({otp: opt});
        }

        const otpPayload = {email, otp};

        //create an entry for OTP
        const otpBody = await OTP.create(otpPayload);
        console.log("OTP Body " ,otpBody);

        //return response successful
        res.status(200).json({
            success:true,
            message: 'OTP Sent Successfully',
            otp,
        });


    }
    catch(error){
        console.log(error.message);
        return res.status(500).json({
            success:false,
            message:error.message,
        })
    }
}


//-------------signUp-----------------------
exports.signup = async(req, res) =>{
    try{
        //data fetch from request body
        const {
            firstName,lastName,
            email,
            password, confirmPassword,
            accountType,
            contactNumber,
            otp
        } = req.body;

        //validate it
        if(!firstName || !lastName || !email || !password || !confirmPassword || !otp){
            return res.status(403).json({
                success:false,
                message: "All fields are required",
            });
        }

        //match password
        if(password!=confirmPassword){
            return res.status(400).json({
                success:false,
                message: "Password and confirmPassword does not match, please try again-",
            });
        }
        //check user already exist or not
        const existingUser = await User.findOne({email});
        if(existingUser){
            return res.status(400).json({
                success:false,
                message: 'User is already registered',
            });
        }
        
        //find the most recent OTP stored for the user
        const recentOtp = await OTP.find({email}).sort({createdAt:-1}).limit(1);
        console.log(recentOtp);
        //validate OTP
        if(recentOtp.length ==0){
            //OTP not found
            return res.status(400).json({
                success:false,
                message:'OTP not found',
            })
        }
        else if(otp!==recentOtp[0].otp){
            //Invalid OTP
            return res.status(400).json({
                success:false,
                message:"Invalid OTP",
            })
        }

        //hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // create the user
        let approved ="";
        approved === "Instuctor" ? (approved = false) : (approved = true);

        //create entry in DB
        const profileDetails = await Profile.create({
            gender:null,
            dateOfBirth:null,
            about:null,
            contactNumber:null,
        });

        const user = await User.create({
            firstName, lastName,
            email, 
            contactNumber,
            password: hashedPassword,
            accountType: accountType,
            approved: approved,
            additionalDetails: profileDetails._id,
            image: `https://api.dicebear.com/5.x/initials/svg?seed=${firstName} ${lastName}`
        })

        // return res
        return res.status(200).json({
            success:true,
            user,
            message: 'User is regestered Successfully',
        })
    }
    catch(error){
        console.log(error);
        return res.status(500).json({
            success:false,
            message:'User cannot be registered. Please try again later',
        })
    }

}


//-------------Login------------------------
exports.login = async (req, res) =>{
    try{
        // get data from req body
        const {email, password} = req.body

        // validation data
        if(!email || !password){
            return res.status(400).json({
                success:false,
                message: "All fields are required, please try again",
            });
        }

        // user check exist or not
        const user = await User.findOne({email}).populate("additionalDetails");
        if(!user){
            return res.status(401).json({
                success:false,
                message:"User is not registered, please signup first",
            });
        }

        // generate JWT token , after password matching
        if(await bcrypt.compare(password, user.password)){
            const payload = {
                email: user.email,
                id: user._id,
                accountType: user.accountType,  
            }
            const token = jwt.sign(payload, process.env.JWT_SECRET,{
                expiresIn:"24h",
            });
            user.token = token;
            user.password = undefined;

            // create cookie and send response
            const options = {
                expires: new Date(Date.now() + 3*24*60*60*1000),
                httpOnly:true,
            };
            res.cookie("token", token, options).status(200).json({
                success:true,
                token,
                user, 
                message: 'User LogIn Successfully',
            });
        }
        else{
            return res.status(401).json({
                success:false,
                message:'Password is incorrect',
            })
        }
    }
    catch(error){
        console.log(error);
        return res.status(500).json({
            success:false,
            message: "Login Faliure, Please login again",
        })
    }
}

//----------------changePassword----------------------

exports.changePassword = async(req, res) =>{
    try{
        // get data from req body
        console.log("Before")
        const userDetails = await User.findById(req.user.id);
        // get oldPassword, newPassword, confirmPassword
        const {oldPassword, newPassword} = req.body;
        // console.log("oldPassword ", oldPassword);
        // console.log("New Password", newPassword);

        //validation
        const isPasswordMatch = await bcrypt.compare(
			oldPassword,
			userDetails.password
		);
		if (!isPasswordMatch) {
			// If old password does not match, return a 401 (Unauthorized) error
			return res.status(401).json({
                success: false, 
                message: "The password is incorrect" 
            });
		}

        // if(newPassword===oldPassword){
        //     return res.status(400).json({
        //         success:false,
        //         message: "New Password and OldPassword are same, please Select different password",
        //     });
        // }


        //hash password
        const encryptedPassword = await bcrypt.hash(newPassword, 10);

        // update password in DB
        const updatedUserDetails = await User.findByIdAndUpdate(
            req.user.id, 
            {password:encryptedPassword}, 
            {new:true}
        );


        // // send Mail - Password updated
        // try {
		// 	const emailResponse = await mailSender(
		// 		updatedUserDetails.email,
		// 		passwordUpdated(
		// 			updatedUserDetails.email,
		// 			`Password updated successfully for ${updatedUserDetails.firstName} ${updatedUserDetails.lastName}`
		// 		)
		// 	);
		// 	console.log("Email sent successfully:", emailResponse.response);
		// } catch (error) {
		// 	// If there's an error sending the email, log the error and return a 500 (Internal Server Error) error
		// 	console.error("Error occurred while sending email:", error);
		// 	return res.status(500).json({
		// 		success: false,
		// 		message: "Error occurred while sending email",
		// 		error: error.message,
		// 	});
		// }
        
        // return respons
        return res.status(200).json({
            success:true,
            message: 'Reset Password Successfully',
        });
    }
    catch(error){
            console.log(error);
            return res.status(500).json({
                success:false,
                message: "Reset Password failed, Please try again later!",
            });
    }
}

