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
        type:String,
        default:"https://media.istockphoto.com/id/610041376/photo/beautiful-sunrise-over-the-sea.jpg?s=612x612&w=0&k=20&c=R3Tcc6HKc1ixPrBc7qXvXFCicm8jLMMlT99MfmchLNA=",

        set:(v)=>{
            if(v===""){ //if v==="" then return default image(both links are same)
                return "https://media.istockphoto.com/id/610041376/photo/beautiful-sunrise-over-the-sea.jpg?s=612x612&w=0&k=20&c=R3Tcc6HKc1ixPrBc7qXvXFCicm8jLMMlT99MfmchLNA="
            }
            else return v;
        },
    },

    price:Number,
    location:String,
    country:String,

  reviews: [
  {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Review"
  }
]
});

const Listing=mongoose.model("Listing",listingSchema);
module.exports=Listing;