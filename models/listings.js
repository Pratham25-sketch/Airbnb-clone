const mongoose=require("mongoose");

const listingSchema=new mongoose.Schema({

    title:{
        type:String,
        required:true,
    },

    description:{
        type:String
    },

    image:{
      url:String,
      filename:String,
    },

    price:Number,
    location:String,
    country:String,

  reviews: [
  {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Review"
  }
],

owner:[ {
  type: mongoose.Schema.Types.ObjectId,
  ref: "User",
  
}],

geometry: {
    type: {
        type: String, // Don't do `{ location: { type: String } }`
        enum: ["Point"], // 'location.type' must be 'Point'
        required: true,
    },
    coordinates: {
        type: [Number],
        required: true,
    },
},

  // ✅ Filter options (restricted to your given list)
  filters: {
    type: [
      {
        type: String,
        enum: ["Trending","Rooms","Iconic Cities","Mountains","Castles","Swimming Pools","Camping","Farms","Arctic",],
      },
    ],
    default: [],
  },
});



const Listing=mongoose.model("Listing",listingSchema);
module.exports=Listing;