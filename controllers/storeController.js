const mongoose = require("mongoose");
const Store = mongoose.model("Store");
const multer = require("multer");
const jimp = require("jimp");
const uuid = require("uuid");

// specify where uploaded file should be save & file types
const multerOptions = {
  storage: multer.memoryStorage(), // into memory so we can resize before saving to file
  fileFilter(req, file, next) {
    const isPhoto = file.mimetype.startsWith("image/");
    if (isPhoto) {
      next(null, true);
    } else {
      next({ message: "That filetype is not allowed!" }, false);
    }
  },
};

exports.homePage = (req, res) => {
  res.render("index");
};

exports.addStore = (req, res) => {
  res.render("editStore", { title: "Add store" });
};

exports.upload = multer(multerOptions).single("photo");

exports.resize = async (req, res, next) => {
  // resize, assign unique id for file name and pass along to create store
  if (!req.file) {
    // multer adds `file` property to the request object
    next(); // if there's no file, skip this function
    return;
  }
  // unique name with filetype extension
  const extension = req.file.mimetype.split("/")[1];
  req.body.photo = `${uuid.v4()}.${extension}`;

  // resize
  const photo = await jimp.read(req.file.buffer);
  await photo.resize(800, jimp.AUTO);
  await photo.write(`./public/uploads/${req.body.photo}`);

  next();
};

exports.createStore = async (req, res) => {
  const store = await new Store(req.body).save();
  req.flash(
    "success",
    `Successfully created ${store.name}. Care to leave a review?`
  );
  res.redirect(`/store/${store.slug}`);
};

exports.getStoreBySlug = async (req, res, next) => {
  const store = await Store.findOne({ slug: req.params.slug });
  if (!store) return next(); // if there's no matching store, move on to the error handling from app.js
  // res.json(store.name);
  res.render("store", { store, title: store.name });
};

exports.getStores = async (req, res) => {
  const stores = await Store.find();
  res.render("stores", { title: "Stores", stores });
};

exports.editStore = async (req, res) => {
  // 1. fetch store from DB given id
  const store = await Store.findOne({ _id: req.params.id });

  // 2. confirm they are the owner
  // TODO

  // 3. render the edit form so user can update the store
  res.render("editStore", { title: `Edit ${store.name}`, store });
};

exports.updateStore = async (req, res) => {
  // set the location data to be a point
  req.body.location.type = "Point";

  // find and update store
  const store = await Store.findOneAndUpdate({ _id: req.params.id }, req.body, {
    new: true, // returns the updated data instead of the old data so we can render it
    runValidators: true, // runs whatever validators are on the model
  }).exec(); // runs the `findOneAndUpdate` query immediately

  // tell them if it worked
  req.flash(
    "success",
    `Successfully updated <strong>${store.name}</strong>. 
    <a href="/store/${store.slug}">View Store</a>`
  );

  // redirect to udpated edit screen
  res.redirect(`/store/${store.slug}/edit`);
};

exports.getStoresByTag = async (req, res) => {
  const tag = req.params.tag;
  const tagQuery = tag || { $exists: true };
  // if there is no specified tag, query for all entries with any tags

  const tagsPromise = Store.getTagsList();
  // returns a Promise for the list of tags with counts
  // getTagsList is a custom function we declared on our schema in Store.js

  const storesPromise = Store.find({ tags: tagQuery });
  // returns a Promise for the list of stores for each tag

  const [tags, stores] = await Promise.all([tagsPromise, storesPromise]);
  // triggers all of the Promise functions
  // destructure the result of the Promises into distinct variables

  res.render("tag", { title: "Tags", tags, stores, tag });
};
