const { get, getPartyBalance, getAllPartyBalance } = require("../controllers/ladger.controller");
const router = require("express").Router();


router
    .route("/get")
    .post(get);

router
    .route("/get-party-balance")
    .post(getPartyBalance);

router
    .route("/get-all-party-balance")
    .post(getAllPartyBalance);

module.exports = router;