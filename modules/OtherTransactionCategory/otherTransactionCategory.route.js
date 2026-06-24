const router = require("express").Router();
const OtherTransactionCategoryController = require("./otherTransactionCategory.controller");
const authMiddleware = require("../../middlewares/auth.middleware");



router
    .route("/add")
    .post(authMiddleware, OtherTransactionCategoryController.add);

router
    .route('/get')
    .post(authMiddleware, OtherTransactionCategoryController.get);

router
    .route("/delete")
    .delete(authMiddleware, OtherTransactionCategoryController.remove);


module.exports = router;