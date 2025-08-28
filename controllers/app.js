// REQUIRE MODELS USED
const Listing = require("../models/listings");
const Review = require("../models/reviews");
const ExpressError = require("../utilities/ExpressError"); // <-- make sure you have this

const mbxGeocoding = require("@mapbox/mapbox-sdk/services/geocoding");
const mapToken = process.env.MAP_TOKEN;
const geocodingClient = mbxGeocoding({ accessToken: mapToken });

// SHOW LISTINGS
module.exports.showListings = async (req, res) => {
  const { filter } = req.query;

  let query = {};
  if (filter) {
    query.filters = filter;  // match filter
  }

  const listings = await Listing.find(query).populate("reviews");

  res.render("index.ejs", { listings, filter });
};


// NEW LISTING (FORM)
module.exports.newListingGET = async (req, res) => {
  res.render("new.ejs");
};

// CREATE LISTING
module.exports.newListingPOST = async (req, res) => {
  let { title, description, price, location, country } = req.body;
  let filters = req.body.listing?.filters || []; // ✅ grab filters

  let response = await geocodingClient
    .forwardGeocode({
      query: location,
      limit: 1,
    })
    .send();

  if (
    !title ||
    !description ||
    !req.file ||
    !price ||
    !location ||
    !country
  ) {
    throw new ExpressError(400, "All fields are required!");
  }

  let url = req.file.path;
  let filename = req.file.filename;

  const listing = new Listing({
    title,
    description,
    image: { url, filename },
    price,
    location,
    country,
    owner: req.user._id,
    geometry: response.body.features[0].geometry,
    filters, // ✅ save filters
  });

  await listing.save();

  req.flash("success", "New listing created successfully!!");
  res.redirect("/listings");
};

// VIEW LISTING
module.exports.viewListing = async (req, res) => {
  const { id } = req.params;
  const listing = await Listing.findById(id)
    .populate({
      path: "reviews",
      populate: { path: "author", select: "username" },
    })
    .populate("owner");

  if (!listing) {
    req.flash("success", "Listing you requested for does not exist!!");
    return res.redirect("/listings");
  }

  if (!listing.owner || !listing.owner.username) {
    listing.owner = listing.owner || {};
    listing.owner.username = "delta-student";
  }
  if (!listing.owner.email) {
    listing.owner.email = "delta@gmail.com";
  }

  res.render("show.ejs", { listing });
};

// EDIT LISTING (FORM)
module.exports.editListingGET = async (req, res) => {
  let { id } = req.params;
  const listing = await Listing.findById(id);

  if (!listing) {
    req.flash("success", "Listing you requested for does not exist!!");
    return res.redirect("/listings");
  }

  if (String(listing.owner) != String(req.user._id)) {
    req.flash("error", "Only the listing owner can edit this listing !!");
    return res.redirect(`/listings/${id}`);
  }

  res.render("edit.ejs", { listing });
};

// UPDATE LISTING
module.exports.editListingPATCH = async (req, res) => {
  let { id } = req.params;
  let { title, description, price, location, country, owner } = req.body;
  let filters = req.body.listing?.filters || []; // ✅ grab filters

  const geoData = await geocodingClient
    .forwardGeocode({
      query: location,
      limit: 1,
    })
    .send();

  if (!geoData.body.features.length) {
    throw new ExpressError(400, "Invalid location provided!");
  }

  const updateData = {
    title,
    description,
    price,
    location,
    country,
    owner,
    filters, // ✅ update filters
    geometry: geoData.body.features[0].geometry,
  };

  if (req.file) {
    updateData.image = {
      url: req.file.path,
      filename: req.file.filename,
    };
  }

  if (!title || !description || !price || !location || !country) {
    throw new ExpressError(400, "All fields are required!");
  }

  await Listing.findByIdAndUpdate(id, updateData);

  req.flash("success", "Listing updated successfully!!");
  res.redirect(`/listings/${id}`);
};

// DELETE LISTING
module.exports.deleteListingDELETE = async (req, res) => {
  const { id } = req.params;
  const listing = await Listing.findById(id);

  if (String(listing.owner) != String(req.user._id)) {
    req.flash("error", "Only the listing owner can delete this listing !!");
    return res.redirect(`/listings/${id}`);
  }

  if (listing && listing.reviews && listing.reviews.length > 0) {
    await Review.deleteMany({ _id: { $in: listing.reviews } });
  }

  await Listing.findByIdAndDelete(id);

  req.flash("success", "Listing deleted successfully!!");
  res.redirect("/listings");
};

// POST REVIEW
module.exports.reviewsPOST = async (req, res) => {
  const { id } = req.params;
  const { rating, comment } = req.body;

  const listing = await Listing.findById(id);

  const review = new Review({
    rating: rating,
    comment: comment,
    author: req.user._id,
  });

  await review.save();
  listing.reviews.push(review._id);
  await listing.save();

  req.flash("success", "Review created successfully!!");
  res.redirect(`/listings/${id}`);
};

// DELETE REVIEW
module.exports.reviewsDELETE = async (req, res) => {
  const { id, reviewId } = req.params;
  const review = await Review.findById(reviewId);

  if (String(review.author) != String(res.locals.workingUser._id)) {
    req.flash(
      "error",
      "You can't delete this review because you are not the author!!"
    );
    return res.redirect(`/listings/${id}`);
  } else {
    await Listing.findByIdAndUpdate(id, {
      $pull: { reviews: reviewId },
    });

    await Review.findByIdAndDelete(reviewId);

    req.flash("success", "Review deleted successfully!!");
    res.redirect(`/listings/${id}`);
  }
};
