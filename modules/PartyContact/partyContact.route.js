const router = require("express").Router();
const PartyContactController = require("./partyContact.controller");
const authMiddleware = require("../../middlewares/auth.middleware");



router
    .route("/add")
    .post(authMiddleware, PartyContactController.addPartyContact);

router
    .route("/update")
    .patch(authMiddleware, PartyContactController.updatePartyContact);

router
    .route("/delete")
    .delete(authMiddleware, PartyContactController.deletePartyContact);

router
    .route("/get")
    .post(authMiddleware, PartyContactController.getSinglePartyContact);

router
    .route("/get-all")
    .post(authMiddleware, PartyContactController.getAllPartyContacts);


module.exports = router;