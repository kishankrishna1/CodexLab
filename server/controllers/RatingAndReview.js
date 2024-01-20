const RatingAndReview = require('../models/RatingAndReview');
const Course = require('../models/Course');
const { default: mongoose } = require('mongoose');

//----------------create rating and reviews--------------------------------
exports.createRating = async (req, res) => {
    try{
        // gat user Id
        const userId = req.user.id;

        // fetch data from req body
        const {rating, review, courseId} = req.body;

        // check if user is enrolled or not
        const courseDetails = await Course.findOne(
            {_id:courseId,
            studentsEnroled: {$eleMatch: {$eq: userId}},
            }
        )

        if(!courseDetails){
            return res.status(404).json({
                success:false,
                message: "Student is not enrolled in the course",
            });
        }

        // check if User already reviewed the course
        const alreadyReviewed = await RatingAndReview.findOne({
            user: userId,
            course:courseId,
        });
        if(alreadyReviewed){
            return res.status(403).json({
                success:false,
                message: "course is already reviewed by the user",
            });
        }

        // create rating and review
        const ratingReview = await RatingAndReview.create({
            rating, review,
            course:courseId,
            user:userId,
        });


        // update course with this rating/review
        const updatedCourseDetails = await Course.findByIdAndUpdate(
            {_id:courseId}, 
            {
                $push: {
                    ratingAndReviews: ratingReview._id,
                }
            },
            {new:true}
        );
        console.log(updatedCourseDetails);

        // return response
        return res.status(200).json({
            success:true,
            message: "Rating and review created successfully",
            ratingReview,
        });


    }
    catch(error){
        console.log(error);
        return res.status(500).json({
            success:false,
            message:"Something went wrong while creating rating and review",
    });
    }
}


//----------------getAveragerating--------------------------
exports.getAverageRating = async(req, res) => {
    try{
        // get course ID
        const {courseId} = req.body;

        // calculate avg rating
        const result = await RatingAndReview.aggregate([
            {
                $match:{
                    course: new mongoose.Types.ObjectId(courseId),
                },
            },
            {
                $group:{
                    _id:null,
                    averageRating: { $avg: "$rating"},
                }
            }
        ])

        // return response
        if(result.length > 0){
            return res.status(200).json({
                success:true,
                averageRating: result[0].averageRating,
            })
        }

        // if no rating review exit
        return res.status(200).json({
            success:true,
            message: "Average rating is 0 , no rating given till now",
            averageRating: 0
        })

    }
    catch(error){
        console.log(error);
        return res.status(500).json({
            success:false,
            message: "Something went wrong while getting average rating",
        });

    }
}


// ---------------getAllRaing & reviews--------------------------------

exports.getAllRatingReview = async (req, res) => {
    try{
        const allReviews = await RatingAndReview.find({})
            .sort({rating: "desc"})
            .populate({
                path:"User",
                select:"firstName lastName email image",
            })
            .populate({
                path: "Course",
                select: "courseName",
            })
            .exc();

        // return response
        return res.status(200).json({
            success:true,
            message: "All rating and reviews fetched successfully",
            data:allReviews,
        });
    }
    catch(error){
        console.log(error);   
        return res.status(500).json({
            success: false,
            message: "Something went wrong while getting all rating and reviews", 
        });
    }
}


