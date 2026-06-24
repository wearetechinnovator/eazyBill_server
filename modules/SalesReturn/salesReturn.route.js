const router = require("express").Router();
const SalesReturnController = require("./salesReturn.controller");
const authMiddleware = require("../../middlewares/auth.middleware");


router
  .route("/add")
  .post(authMiddleware, SalesReturnController.add);


router
  .route("/get")
  .post(authMiddleware, SalesReturnController.get);

  
router
  .route("/delete")
  .delete(authMiddleware, SalesReturnController.remove);



module.exports = router;