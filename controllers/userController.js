const mongoose = require("mongoose");
const User = mongoose.model("User");
const promisify = require("es6-promisify");

exports.loginForm = (req, res) => {
  res.render("login", { title: "Login" });
};

exports.registerForm = (req, res) => {
  res.render("register", { title: "Register" });
};

exports.validateRegister = (req, res, next) => {
  req.sanitizeBody("name");
  req.checkBody("name", "You must supply a name!").notEmpty();
  req.checkBody("email", "That email is not valid.").isEmail();
  req.sanitizeBody("email").normalizeEmail({
    remove_dots: false,
    remove_extension: false,
    gmail_remove_subaddress: false,
  });
  req.checkBody("password", "Password cannot be blank!").notEmpty();
  req
    .checkBody("password-confirm", "Confirmed password can not be blank!")
    .notEmpty();
  req
    .checkBody("password-confirm", "Oops! Your passwords do not match")
    .equals(req.body.password);

  const errors = req.validationErrors();
  if (errors) {
    req.flash(
      "error",
      errors.map((err) => err.msg)
    );
    res.render("register", {
      title: "Register",
      body: req.body,
      flashes: req.flash(),
    });
  }
  next(); // pass to register
};

// promisify library - if passing a method, also pass the object so it knows what to bind to
// `register` function from `passport` library takes care of actually registering the user & hashing the password
exports.register = async (req, res, next) => {
  const user = new User({ email: req.body.email, name: req.body.name });

  // using es6-promisify
  const registerWithPromise = promisify(User.register, User); // now the registerWithPromise function will return a Promise, instead of a callback
  await registerWithPromise(user, req.body.password);
  next(); // pass to authController.login
};

exports.account = (req, res) => {
  res.render("account", { title: "Edit Your Account" });
};

exports.updateAccount = async (req, res) => {
  // create an object of what is updated
  const updates = {
    name: req.body.name,
    email: req.body.email,
  };

  // find the user and update
  const user = await User.findOneAndUpdate(
    // takes query, update, options
    { _id: req.user._id }, // query based on id of user
    { $set: updates }, // overwrite updated info on top of existing user object
    { new: true, runValidators: true, context: "query" }
    // returns new object, runs validations, 'query' triggers the query.
  );

  req.flash("success", "Your account has been updated!");
  res.redirect("back");
};
