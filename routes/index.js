const express = require("express");
const router = express.Router();
const storeController = require("../controllers/storeController");
const userController = require("../controllers/userController");
const authController = require("../controllers/authController");
const { catchErrors } = require("../handlers/errorHandlers");

// STORES
router.get("/", storeController.getStores);
router.get("/stores", storeController.getStores);
router.get("/add", authController.isLoggedIn, storeController.addStore);
router.get("/store/:slug", catchErrors(storeController.getStoreBySlug));

router.post(
  "/add",
  storeController.upload,
  catchErrors(storeController.resize),
  catchErrors(storeController.createStore)
);

router.post(
  "/add/:id",
  storeController.upload,
  catchErrors(storeController.resize),
  catchErrors(storeController.updateStore)
);

router.get("/stores/:id/edit", catchErrors(storeController.editStore));

// TAGS
router.get("/tags", catchErrors(storeController.getStoresByTag));
router.get("/tags/:tag", catchErrors(storeController.getStoresByTag));

// USER
router.get("/login", userController.loginForm);
router.post("/login", authController.login);

router.get("/register", userController.registerForm);

// 1. validate registration data
// 2. register the user (save to database)
// 3. log them in
router.post(
  "/register",
  userController.validateRegister,
  catchErrors(userController.register),
  authController.login
);

router.get("/logout", authController.logout);
router.get("/account", authController.isLoggedIn, userController.account);
router.post("/account", catchErrors(userController.updateAccount));

router.post("/account/forgot", catchErrors(authController.forgot));
router.get(
  "/account/reset/:token",
  catchErrors(authController.findUser),
  catchErrors(authController.reset)
);
router.post(
  "/account/reset/:token",
  authController.confirmedPasswords,
  catchErrors(authController.findUser),
  catchErrors(authController.update)
);

// MAP
router.get("/map", storeController.mapPage);

// API
router.get("/api/search", catchErrors(storeController.searchStores));
router.get("/api/stores/near", catchErrors(storeController.mapStores));
router.post("/api/stores/:id/heart", catchErrors(storeController.heartStore));

module.exports = router;
