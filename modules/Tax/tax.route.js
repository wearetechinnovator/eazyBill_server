const router = require("express").Router();
const TaxController = require("./tax.controller");
const authMiddleware = require("../../middlewares/auth.middleware");


router
    .route("/add")
    .post(authMiddleware, TaxController.add);

router
    .route('/get')
    .post(authMiddleware, TaxController.get);

router
    .route("/delete")
    .delete(authMiddleware, TaxController.remove);



module.exports = router;