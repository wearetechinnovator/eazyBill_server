const { add, get, remove, restore, getLog, getPartyBalance } = require("../controllers/party.controller");
const PartyController = require("../controllers/extranal/party.controller");
const { get: ladgerGet } = require("../controllers/ladger.controller");
const extranalApiCheck = require("../middlewares/extranalApiCheck");
const router = require("express").Router();

router
  .route("/add")
  .post(add);

router
  .route("/extranal/add")
  .post(extranalApiCheck, PartyController.addParty);

router
  .route("/get")
  .post(get);

router
  .route("/delete")
  .delete(remove);

router
  .route("/restore")
  .post(restore);

router
  .route("/log")
  .post(getLog)

router
  .route("/ladger")
  .post(ladgerGet);


module.exports = router;
