const mongoose = require("mongoose");
const User = mongoose.model("User");
const promisify = require("es6-promisify");
// const { promisify } = require("util");

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
};

// promisify library - if passing a method, also pass the object so it knows what to bind to
// `register` function from `passport` library takes care of actually registering the user & hashing the password
exports.register = async (req, res, next) => {
  const user = new User({ email: req.body.email, name: req.body.name });

  // using util.promisify
  // const registerWithPromise = promisify(User.register);
  // await registerWithPromise(user, req.body.password);
  // res.send("it works!");

  // using es6-promisify
  const registerWithPromise = promisify(User.register, User); // now the registerWithPromise function will return a Promise, instead of a callback
  await registerWithPromise(user, req.body.password);
  res.send("it works!");
};

// registration is not going through - no error message
// check Slack for other people's issues
