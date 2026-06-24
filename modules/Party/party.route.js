const router = require("express").Router();
const PartyController = require("./party.controller");
const LadgerController = require("../Ladger/ladger.controller");
const authMiddleware = require("../../middlewares/auth.middleware")

router
    .route("/add")
    .post(authMiddleware, PartyController.add);


router
    .route("/get")
    .post(authMiddleware, PartyController.get);

router
    .route("/delete")
    .delete(authMiddleware, PartyController.remove);

router
    .route("/log")
    .post(authMiddleware, PartyController.getLog)

router
    .route("/ladger")
    .post(authMiddleware, LadgerController.get);


module.exports = router;
