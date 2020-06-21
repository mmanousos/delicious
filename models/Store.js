const mongoose = require("mongoose");
mongoose.Promise = global.Promise;

const slug = require("slugs");

const storeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true, // removes white space (Wes's suggests formatting data as close to model as possible)
      required: "Please enter a store name", // instead of boolean, return error message if it's missing
    },
    slug: String,
    description: {
      type: String,
      trim: true,
    },
    tags: [String], // can contain one or many tags
    created: {
      type: Date,
      default: Date.now,
    },
    location: {
      type: {
        type: String,
        default: "Point",
      },
      coordinates: [
        {
          type: Number,
          required: "You must supply coordinates!",
        },
      ],
      address: {
        type: String,
        required: "You must supply an address!",
      },
    },
    photo: String,
    author: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
      required: "You must supply an author",
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// define indexes
storeSchema.index({
  name: "text",
  description: "text",
});

storeSchema.index({
  location: "2dsphere",
});

storeSchema.pre("save", async function (next) {
  if (!this.isModified("name")) {
    next(); // skip it
    return; // stop the function from running
  }
  this.slug = slug(this.name); // use slug package to create a url for the name of the store

  // use regex to search for other stores with the same slug
  // if there are any matches, rename the slug by adding a number one higher than the current number
  const slugRegEx = new RegExp(`^(${this.slug})((-\d*$)?)$`, "i");
  const storesWithSlug = await this.constructor.find({ slug: slugRegEx });
  if (storesWithSlug.length) {
    this.slug = `${this.slug}-${storesWithSlug.length + 1}`;
  }

  next(); // move on to the next function
});

storeSchema.statics.getTagsList = function () {
  return this.aggregate([
    { $unwind: "$tags" },
    { $group: { _id: "$tags", count: { $sum: 1 } } },
    { $sort: { count: -1 } },
  ]);
};

storeSchema.statics.getTopStores = function () {
  return this.aggregate([
    // lookup stores and populate their reviews
    {
      $lookup: {
        from: "reviews",
        localField: "_id",
        foreignField: "store",
        as: "reviews",
      },
    },
    // filter for only items that have 2 or more reviews
    {
      $match: { "reviews.1": { $exists: true } },
    },
    // add an "average reviews" field
    {
      $project: {
        // be sure to also pull in photo, name, number of reviews
        photo: "$$ROOT.photo",
        name: "$$ROOT.name",
        slug: "$$ROOT.slug",
        reviews: "$$ROOT.reviews",
        averageRating: {
          $avg: "$reviews.rating",
        },
      },
    },
    // sort by the new average reviews field, highest reviews first
    {
      $sort: {
        averageRating: -1,
      },
    },
    // limit to max 10
    {
      $limit: 10,
    },
  ]);
};

storeSchema.virtual("reviews", {
  // query an additional model without denormalizing the data
  ref: "Review", // which model: "Review"
  localField: "_id", // what is the field in our current model: "_id"
  foreignField: "store", // what is the related field in the other model: "store"
});

module.exports = mongoose.model("Store", storeSchema);
