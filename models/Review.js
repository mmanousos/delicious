const mongoose = require("mongoose");
mongoose.Promise = global.Promise;

const reviewSchema = new mongoose.Schema({
  author: {
    type: mongoose.Schema.ObjectId,
    ref: "User",
    required: "You must supply an author",
  },
  rating: {
    type: Number,
    min: 1,
    max: 5,
  },
  text: {
    type: String,
    required: "You must describe your star rating",
  },
  created: {
    type: Date,
    default: Date.now,
  },
  store: {
    type: mongoose.Schema.ObjectId,
    ref: "Store",
    required: "You must indicate the store you're reviewing",
  },
});

function autopopulate(next) {
  this.populate("author");
  next();
}

reviewSchema.pre("find", autopopulate);
reviewSchema.pre("findOne", autopopulate);

module.exports = mongoose.model("Review", reviewSchema);
