const express = require("express");
const router = express.Router();
const storeController = require("../controllers/storeController");
const userController = require("../controllers/userController");
const { catchErrors } = require("../handlers/errorHandlers");

// stores
router.get("/", storeController.getStores);
router.get("/stores", storeController.getStores);
router.get("/add", storeController.addStore);
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

// tags
router.get("/tags", catchErrors(storeController.getStoresByTag));
router.get("/tags/:tag", catchErrors(storeController.getStoresByTag));

// user
router.get("/login", userController.loginForm);
router.get("/register", userController.registerForm);

// 1. validate registration data
// 2. register the user (save to database)
// 3. log them in
router.post(
  "/register",
  userController.validateRegister,
  catchErrors(userController.register)
);

module.exports = router;
