const express = require("express");
const router = express.Router({ mergeParams: true });
const wrapAsync = require("../utils/wrapAsync.js");
ExpressError = require("../utils/ExpressError.js");
const Review = require("../models/review.js");
const Listing = require("../models/listing");
const { validateReview, isLoggedIn, isreviewAuthor } = require("../middleware.js");

const reviewController = require("../controllers/reviews.js");

//Reviews
//Post review Route
router.post("/",
    isLoggedIn,
    validateReview,
    wrapAsync(reviewController.createReview)
);

//delete route for reviews
router.delete(
    "/:reviewId",
    isLoggedIn,
    isreviewAuthor,
    wrapAsync(reviewController.deleteReview)
);

module.exports = router;