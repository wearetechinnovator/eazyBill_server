const router = require("express").Router();
const LadgerController = require("./ladger.controller");
const authMiddleware = require("../../middlewares/auth.middleware")



router
    .route("/get")
    .post(authMiddleware, LadgerController.get);

router
    .route("/get-party-balance")
    .post(authMiddleware, LadgerController.getPartyBalance);

router
    .route("/get-all-party-balance")
    .post(authMiddleware, LadgerController.getAllPartyBalance);

module.exports = router;