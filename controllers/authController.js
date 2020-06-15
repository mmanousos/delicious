const passport = require("passport");
const crypto = require("crypto");
const mongoose = require("mongoose");
const User = mongoose.model("User");
const promisify = require("es6-promisify");

exports.login = passport.authenticate("local", {
  failureRedirect: "/login",
  failureFlash: "Failed login!",
  successRedirect: "/",
  successFlash: "You are now logged in.",
});

exports.logout = (req, res) => {
  req.logout();
  req.flash("success", "You are now logged out!");
  res.redirect("/");
};

exports.isLoggedIn = (req, res, next) => {
  // check if the user is authenticated
  if (req.isAuthenticated()) {
    next();
    return;
  }
  req.flash("error", "Oops you must be logged in to do that!");
  res.redirect("/login");
};

exports.forgot = async (req, res) => {
  // 1. does user exist
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    req.flash("error", "No account with that email exists.");
    return res.redirect("/login");
  }

  // 2. set reset tokens and expiry on their account
  user.resetPasswordToken = crypto.randomBytes(20).toString("hex");
  user.resetPasswordExpires = Date.now() + 3600000;
  await user.save();

  // 3. send email with the token
  const resetURL = `http://${req.headers.host}/account/reset/${user.resetPasswordToken}`;
  req.flash(
    "success",
    `You have been emailed a password reset link. ${resetURL}`
  );

  // 4. redirect to login page
  res.redirect("/login");
};

exports.findUser = async (req, res, next) => {
  const user = await User.findOne({
    resetPasswordToken: req.params.token,
    resetPasswordExpires: { $gt: Date.now() },
  });

  if (!user) {
    req.flash("error", "Password reset does not exist or has expired");
    req.redirect("/login");
  }

  next(user);
};

exports.reset = async (req, res) => {
  // if there is a user, show the reset password form
  res.render("reset", { title: "Reset Password" });
};

exports.confirmedPasswords = (req, res, next) => {
  if (req.body.password === req.body["password-confirm"]) {
    next();
    return;
  }

  req.flash("error", "Passwords do not match!");
  res.redirect("back");
};

exports.update = async (req, res, user) => {
  // `setPassword` is provided by passport library - but is callback-based
  const setPasswordWithPromise = promisify(user.setPassword, user);
  await setPasswordWithPromise(req.body.password);

  // remove token and expiration by setting to undefined
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;
  const updatedUser = await user.save();

  // log user in
  await req.login(updatedUser); // passport library accepts a user and can log them in
  req.flash("success", "Your password is updated! You are now logged in!");
  res.redirect("/");
};

// is it possible to pass the user object to the next function from a middleware?
