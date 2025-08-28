//FOR EXPRESS
const express = require("express");
const app = express();


//EXPRESS SESSIONS,FLASH MESSAGES AND MONGO STORE(FOR DEPLOYMENT)

const session=require("express-session");
const flash=require("connect-flash");
const MongoStore = require("connect-mongo");


// Importing MongoStore from 'connect-mongo'
// This allows us to store session data in MongoDB
const store = MongoStore.create({

  // mongoUrl: The MongoDB connection string
  // Replace DB_URL with your actual MongoDB URI
  mongoUrl:"mongodb+srv://b323025_db_user:WsyqTIDgFXQAXJ8J@pratham.4upkfbp.mongodb.net/?retryWrites=true&w=majority&appName=Pratham",

  
  crypto: { // crypto: Used for encrypting the session data before storing in MongoDB
    
    secret: "mysecretcode", // Secret key for encrypting the session data
  },

  
  touchAfter: 24 * 3600, //Time period (in seconds) after which session will be updated in the database
                        // Helps reduce frequent unnecessary writes (lazy update)
});

store.on("error",()=>{
  console.log("Error in Mongo session store",err);
})
/*AFTER THIS MONGO ATLAS MEI EK "sessions" MODEL AAEYAGA (for session info) ALONG WITH "listings,reviews,users"
  default time for a session to expire is 14 days*/


app.use(session(
   {
    store:store, //upar wala store jo create hua
    secret: "mysecretcode",
    resave: false,
    saveUninitialized: true,
    cookie: {
        expires: Date.now() + 1000 * 60 * 60 * 24 * 7, //cookie expires after 1 week
        maxAge: 1000 * 60 * 60 * 24 * 3,
        httpOnly: true //prevents cross scripting attacks
    },
  }));

app.use(flash());

//requiring login middleware(isLoggedIn);
const {isLoggedIn}=require("./utilities/loginMiddleware.js");
const {saveRedirectUrl}=require("./utilities/loginMiddleware.js");

//AUTHENTICATE AND AUTHORIZE
const passport=require("passport");
const LocalStrategy=require("passport-local");
const User=require("./models/user.js");

app.use(passport.initialize()); //middleware that initialize passport
app.use(passport.session()); /*user switch tabs then he dont need to
                              login again(means he is still in same session)*/

passport.use(new LocalStrategy(User.authenticate())); //login and signup process
passport.serializeUser(User.serializeUser()); //user related info ko store karwana
passport.deserializeUser(User.deserializeUser()); //user related info ko delete karwana

app.get("/registerUser", async (req, res) => {
    let fakeUser = new User({
        email: "student@gmail.com",
        username: "delta-student",
    });
    let newUser = await User.register(fakeUser, "helloworld"); //helloworld is password
    res.send(newUser);
});


//res.locals
app.use((req,res,next)=>{
    res.locals.success=req.flash(("success"));
    res.locals.error=req.flash(("error"));
    res.locals.currUser=req.isAuthenticated();//used in navbar(signup,login,logout)
    res.locals.workingUser=req.user;
    next();
  })

//FOR EJS
app.set("view engine", "ejs");

const ejsMate=require("ejs-mate");
app.engine("ejs",ejsMate);


app.use(express.urlencoded({ extended: true })); //not suitable for uploading files so we use multer
app.use(express.json());

if(process.env.NODE_ENV !="production"){ //we need this for development and not for production
  require("dotenv").config(); //convert our .env file to process.env
}// console.log(process.env.password); prints microsoft@62 if .env has "password=microsoft@62"

//CONNECTING BACKEND TO CLOUDINARY
const multer = require('multer');
const { cloudinary, storage } = require("./CloudConfig.js");
const upload = multer({storage}); //humara image backend se cloudinary pr kaha upload hoga
//go to Cloudinary->Assets->Folders->Wanderlust_DEV to see the image we uploaded

/*process:-form upload file to backend->backend passes it to cloudinary to store->cloudinary 
returns a url(req.file) of that file to store in mongodb*/

//GEOCODING(USE AFTER THE .env file code above)
//GEOCODING
const mbxGeocoding = require('@mapbox/mapbox-sdk/services/geocoding');
const mapToken = process.env.MAP_TOKEN;
const geocodingClient = mbxGeocoding({ accessToken: mapToken });


app.use(express.static("public")); //for css styling


var methodOverride = require('method-override')
app.use(methodOverride('_method'))

const wrapAsync=require("./utilities/wrapAsync.js");
const ExpressError=require("./utilities/ExpressError.js");

//FOR MONGODB
const mongoose = require("mongoose");
main()
  .then(() => {
    console.log("connection successful");
  })
  .catch((err) => console.log("error found in connection"));
async function main() {
  await mongoose.connect(process.env.ATLASDB_URL); //now our database is connected to Mongo Atlas
  //MONGO ATLAS-cloud database service.we can deploy a multi-cloud database using Mongo Atlas
  //goto mongo atlas->data explorer->test to see the data inside models(listings,reviews,users)
}

const Listing=require("./models/listings.js");
const Review=require("./models/reviews.js");
/*const User=require("./models/user.js");   this is already declared*/

//SIGNUP NEW USER
app.get("/signup",wrapAsync(async (req,res)=>{
  res.render("signup/signup.ejs");
}));

app.post("/signup",wrapAsync(async (req, res) => {
  
        try {
            let { username, email, password } = req.body;
            const newUser = new User({ email, username });
            const registeredUser = await User.register(newUser, password);
            console.log(registeredUser);

            //signup krte hee automatically logged in ho
            req.login(registeredUser, (err) => {
             if (err) {
                next(err);
                  }
            req.flash("success", `Welcome to Wanderlust,you are now logged in with username ${username}!`);
            res.redirect("/listings");
});

      
        } catch (e) {
            req.flash("success", e.message); //like 2 users with same username
            res.redirect("/signup");
        }
    })
);

//LOGIN EXISTING USER
app.get("/login", (req, res) => {
    res.render("signup/login.ejs");
});


app.post("/login",saveRedirectUrl,
    passport.authenticate("local", { //"local" is the strategy(like facebook login type)
        failureRedirect: "/login", //failure pr redirect kro to "/login "
        failureFlash: true,        //failure pr ek flash message aaega
    }),wrapAsync(async (req, res) => {
        let{username,password}=req.body;

        console.log(req.user._id);

    let redirectUrl = res.locals.redirectUrl || "/listings";
    delete res.locals.redirectUrl;

    req.flash("success", `Hey ${username}, welcome back to Wanderlust!!`);
    res.redirect(redirectUrl);
        
        
    }
));

//LOG OUT USER
app.get("/logout", (req,res,next) => {
    req.logout((err) => {
        if (err) {
            return next(err);
        }
        req.flash("success", "You have successfully logged out!!");
        res.redirect("/listings");
    });
});

//REQUIRING CONTROLLER
const controller=require("./controllers/app.js");

// Basic route
app.get("/listings",wrapAsync(controller.showListings));


//CREATE A NEW LISTING
app.get("/listings/new",isLoggedIn,wrapAsync(controller.newListingGET));

app.post("/listings",isLoggedIn,upload.single("image"),wrapAsync(controller.newListingPOST)); 
//upload.single("image") is "single" as total files uploaded and "image" is file name jo query mei jata hai"(now our file can be sent and understood by backend)


//VIEWING A PARTICULAR LISTING
app.get("/listings/:id",wrapAsync(controller.viewListing));

//EDIT A LISTING
app.get("/listings/:id/edit",isLoggedIn,wrapAsync(controller.editListingGET));

app.patch("/listings/:id",isLoggedIn,upload.single("image"),wrapAsync(controller.editListingPATCH));

// DELETE A LISTING
app.delete("/listings/:id",isLoggedIn,wrapAsync(controller.deleteListingDELETE));

//SEARCH A LISTING
app.get("/search", async (req, res) => {
  const query = req.query.q; // get the ?q= value from URL

  // If nothing typed, show all listings
  if (!query) {
    const allListings = await Listing.find({});
    return res.render("listings/index.ejs", { listings: allListings });
  }

  // Else, find matching listings in MongoDB
  const listings = await Listing.find({
    $or: [
      { title: { $regex: query, $options: "i" } },     // match title
      { location: { $regex: query, $options: "i" } }   // match location

      //     runs a MongoDB query with regex to find
      //     listings where the title or location contains that text (case-insensitive).
    ]
  });

  res.render("search.ejs", { listings,query });
});


//POSTING A REVIEW
// POST /listings/:id/reviews
app.post('/listings/:id/reviews',isLoggedIn, wrapAsync(controller.reviewsPOST));

//DELETING A REVIEW
app.delete("/listings/:id/reviews/:reviewId",isLoggedIn,wrapAsync(controller.reviewsDELETE));


//SEARCHING FOR A PAGE WHICH DOES NOT EXIST
app.use((req, res, next) => { // `use` instead of `all`
  next(new ExpressError(404, "Page not found!!Please check your request"));
   //next goes to niche wala error handling middleware
});

//ERROR HANDLING MIDDLEWARE
app.use((err,req,res,next)=>{
 let{status=500,message="Something went wrong!!We are trying to resolve the issue"}=err;
 res.status(status).render("error.ejs",{status,message});
});

// Start the server
app.listen(8080, () => {
  console.log("app is listening");
});



