if(process.env.NODE_ENV != "production") {
    require("dotenv").config();
}

const express = require("express");
const app = express();
const mongoose = require("mongoose");
const methodOverride = require("method-override");
app.use(methodOverride("_method")); //to override the method of the form to PUT or DELETE
app.use(express.urlencoded({ extended: true })); //to extract/parse the data from the form and make it available in req.body
const ejsMate = require("ejs-mate");
app.engine("ejs", ejsMate); //to use ejs-mate as the template engine
const ExpressError = require("./utils/ExpressError.js");
const session = require("express-session");
const { MongoStore } = require("connect-mongo");
const flash = require("connect-flash");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const User = require("./models/user.js");

const listingsRouter = require("./routes/listing.js");
const reviewsRouter = require("./routes/review.js");
const userRouter = require("./routes/user.js");

const path = require("path");

app.use(express.static(path.join(__dirname, "/public"))); //to serve static files like css, js, images from the public folder  

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

const dbUrl = process.env.ATLASDB_URL;

main()
    .then(() => {
        console.log("connected to DB");
    })
    .catch((err) => {
        console.log(err);
    });

async function main() { //connects database to the server
    await mongoose.connect(dbUrl);
}

const store = MongoStore.create({
    mongoUrl: dbUrl,
    crypto: {
        secret: process.env.SECRET,
    },
    touchAfter: 24 * 3600,
});

store.on("error", (err) => {
    console.log("ERROR in MONGO SESSION STORE", err);
});


const sessionOptions = {
    store,
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: {
        expires: Date.now() + 7 * 24 * 60 * 60 * 1000,
        maxAge: 7 * 24 * 60 * 60 * 1000,
        httpOnly: true,
    },
};

// app.get("/", (req, res) => {
//     res.send("Hi, I am root");
// });

app.use(session(sessionOptions));
app.use(flash());

app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));

passport.serializeUser(User.serializeUser()); //user ke login krne ke bdd ek session ka sara info. store krna serialize hota h
passport.deserializeUser(User.deserializeUser()); //user ka info session se remove krne ke process ko deserialize khte h



//middleware for flash..hum chahte h jaise hi nya listing create ho waise hi hum redirect ho aur flash pop up ho jaye
app.use((req, res, next) => {
    res.locals.success = req.flash("success");
    res.locals.error = req.flash("error");
    res.locals.currUser = req.user; //req.user is available because of passport..yeh middleware hamesha run hoga aur har route pr available hoga
    next();
});

app.use("/listings", listingsRouter);
app.use("/listings/:id/reviews", reviewsRouter);
app.use("/", userRouter);

app.listen(8080, () => {
    console.log("server is listening to port 8080");
});

// app.get("/listing", async (req, res) => {
//     let sampleListing = new Listing({
//         title: "My new villa",
//         description: "By the beach",
//         price: 1200,
//         location: "Calangute, Goa",
//         country: "Sample Country"
//     });
//     await sampleListing.save();
//     console.log("sample was saved");
//     res.send("Sample listing created!");
// });



// agar upar jitna bhi route use alawa kisi route pr req jaye to is code se match ho
app.all("/{*splat}", (req, res, next) => {
    next(new ExpressError(404, "page not found!"));
});

// custom error handling
// custom error handling

app.use((err, req, res, next) => {

    console.log("ERROR:", err);

    let { statusCode = 500, message = "something went wrong!" } = err;

    res.status(statusCode).render("error.ejs", { message });

});