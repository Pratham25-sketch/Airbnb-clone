//FOR EXPRESS
const express = require("express");
const app = express();

//FOR EJS
app.set("view engine", "ejs");

const ejsMate=require("ejs-mate");
app.engine("ejs",ejsMate);


app.use(express.urlencoded({ extended: true }));
app.use(express.json());

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
  await mongoose.connect("mongodb://127.0.0.1:27017/wanderlust");
}

const Listing=require("./models/listings.js");
const Review=require("./models/reviews.js");

// Basic route
app.get("/listings",wrapAsync(async(req, res) => {

  const listings=await Listing.find().populate("reviews");

  res.render("index.ejs",{listings});
}));


//CREATE A NEW LISTING
app.get("/listings/new",wrapAsync(async(req, res) => {
  res.render("new.ejs");
}));

app.post("/listings",wrapAsync(async(req,res)=>{
  let{title,description,image,price,location,country,rating}=req.body;

   // Handle empty or missing req.body
  if (!title || !description || !image || !price || !location || !country || !rating) {
    throw new ExpressError(400, "All fields are required!");
  }


  Listing.insertMany([{
    title:title,
    description:description,
    image:image,
    price:price,
    location:location,
    country:country,
    rating:rating
  }])

  res.redirect("/listings");
}));

//VIEWING A PARTICULAR LISTING
app.get("/listings/:id",wrapAsync(async(req, res) => {

   const { id } = req.params;
    const listing = await Listing.findById(id).populate("reviews");
    res.render("show.ejs", { listing });

}));

//EDIT A LISTING
app.get("/listings/:id/edit",wrapAsync(async(req,res)=>{
  let {id}=req.params;
  const listing=await Listing.findById(id);

  res.render("edit.ejs",{listing})
}));

app.patch("/listings/:id",wrapAsync(async(req,res)=>{
  let {id}=req.params;
  let{title,description,image,price,location,country,rating}=req.body;

   // Handle empty or missing req.body
  if (!title || !description || !image || !price || !location || !country || !rating) {
    throw new ExpressError(400, "All fields are required!");
  }
  
  await Listing.findByIdAndUpdate(id,{title,description,image,price,location,country,rating});

  res.redirect(`/listings/${id}`);
  
}));

// DELETE A LISTING
app.delete("/listings/:id", wrapAsync(async (req, res) => {
    const { id } = req.params;

    // Step 1: Find the listing and populate reviews
    const listing = await Listing.findById(id);

    // Step 2: Delete all reviews linked to the listing
    if (listing && listing.reviews && listing.reviews.length > 0) {

        await Review.deleteMany({ _id: { $in: listing.reviews } });
        //_id of each review is present inside the listing.reviews array.
        
    }

    // Step 3: Now delete the listing itself
    await Listing.findByIdAndDelete(id);

    res.redirect("/listings");
}));

//POSTING A REVIEW
// POST /listings/:id/reviews
app.post('/listings/:id/reviews', wrapAsync(async (req, res) => {
    const { id } = req.params;
    const { rating, comment } = req.body;

  
        const listing = await Listing.findById(id).populate("reviews");

        // Add new review
const review = new Review({ rating:rating, comment: comment });
await review.save();
listing.reviews.push(review._id);
await listing.save();


        // Optionally: update listing.rating to average of reviews
    

        await listing.save();


        res.redirect(`/listings/${id}`);
    
}
));

//DELETING A REVIEW
app.delete("/listings/:id/reviews/:reviewId", async (req, res) => {
    const { id, reviewId } = req.params;

    // Step 1: Remove the review reference from the listing
    await Listing.findByIdAndUpdate(id, {
        $pull: { reviews: reviewId }
    });

    // Step 2: Delete the review document itself
    await Review.findByIdAndDelete(reviewId);

    res.redirect(`/listings/${id}`);
});




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




