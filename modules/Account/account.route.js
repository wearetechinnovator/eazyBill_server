const router = require("express").Router();
const AccountController = require("./account.controller");
const authMiddleware = require("../../middlewares/auth.middleware")


router
  .route("/add")
  .post(authMiddleware, AccountController.add);

router
  .route('/get')
  .post(authMiddleware,AccountController.get);

router
  .route("/delete")
  .delete(authMiddleware, AccountController.remove);

router
  .route("/get-balance")
  .post(authMiddleware, AccountController.getBalance);


module.exports = router;
