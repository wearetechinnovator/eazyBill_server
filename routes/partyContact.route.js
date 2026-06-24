const PartyContactController = require("../controllers/partyContact.controller");
const router = require("express").Router();



router
    .route("/add")
    .post(PartyContactController.addPartyContact);

router
    .route("/update")
    .patch(PartyContactController.updatePartyContact);

router
    .route("/delete")
    .delete(PartyContactController.deletePartyContact);

router
    .route("/get")
    .post(PartyContactController.getSinglePartyContact);

router
    .route("/get-all")
    .post(PartyContactController.getAllPartyContacts);


module.exports = router;
