const router = require("express").Router();
const UserController = require("./user.controller");
const AuthController = require("../Auth/auth.controller");
const authMiddleware = require("../../middlewares/auth.middleware");



router
    .route("/create")
    .post(AuthController.register);

router
    .route("/login")
    .post(AuthController.login);

router
    .route("/check-token")
    .post(AuthController.verifiToken);

router
    .route("/forgot")
    .post(AuthController.forgot);

router
    .route("/verify-otp")
    .post(AuthController.verifyOtp);


// When user forgot password
router
    .route("/reset-pass")
    .post(AuthController.changePassword);


router
    .route("/protect-change-pass")
    .post(AuthController.protectChangePassword)




router
    .route("/get-user")
    .post(authMiddleware,UserController.getUser);

// Change password when user login
router
    .route("/change-pass")
    .post(authMiddleware, UserController.updatepass);

router
    .route("/send-bill")
    .post(authMiddleware, UserController.sendBill)



module.exports = router;