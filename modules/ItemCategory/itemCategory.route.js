const router = require("express").Router();
const ItemCategoryController = require("./itemCategory.controller");
const authMiddleware = require("../../middlewares/auth.middleware")


router
  .route("/add")
  .post(authMiddleware, ItemCategoryController.add);

router
  .route('/get')
  .post(authMiddleware, ItemCategoryController.get);

router
  .route("/delete")
  .delete(authMiddleware, ItemCategoryController.remove);


module.exports = router;