const router = require("express").Router();
const TdsRateController = require("./tdsRate.controller");
const authMiddleware = require("../../middlewares/auth.middleware");


router
    .route("/add")
    .post(authMiddleware, TdsRateController.add);

router
    .route("/get")
    .post(authMiddleware, TdsRateController.get);



module.exports = router;