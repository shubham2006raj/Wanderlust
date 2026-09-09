const Listing = require("../models/listing");
const Review = require("../models/review");


module.exports.createReview = async (req, res) => {
    let listing = await Listing.findById(req.params.id); //Find the listing whose _id is 12345.
    let newReview = new Review(req.body.review);
    //below step is to assign the user id to the author field of the review. This is done so that we can keep track of which user created which review.and nobody should send request from postman to create a review for another user. So we will assign the user id to the author field of the review.
    newReview.author = req.user._id; //Assign the user id to the author field of the review. 

    listing.reviews.push(newReview);

    await newReview.save();
    await listing.save();

    req.flash("success", "New Review Created!");
    res.redirect(`/listings/${listing._id}`);
};

module.exports.deleteReview = async (req, res) => {
    let { id, reviewId } = req.params;

    await Listing.findByIdAndUpdate(id, { $pull: { reviews: reviewId } });

    await Review.findByIdAndDelete(reviewId);

    req.flash("success", "Review Deleted!");
    res.redirect(`/listings/${id}`);
};