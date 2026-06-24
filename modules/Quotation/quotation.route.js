const router = require("express").Router();
const QuotationController = require("./quotation.controller");
const authMiddleware = require("../../middlewares/auth.middleware");



router
    .route("/add")
    .post(authMiddleware, QuotationController.add);

router
    .route("/get")
    .post(authMiddleware, QuotationController.get);

router
    .route("/delete")
    .delete(authMiddleware, QuotationController.remove)

router
    .route("/filter")
    .post(authMiddleware, QuotationController.filter)



module.exports = router;