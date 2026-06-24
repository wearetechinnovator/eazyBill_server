const router = require("express").Router();
const DebitNoteController = require("./debitNote.controller");
const authMiddleware = require("../../middlewares/auth.middleware")


router
    .route("/add")
    .post(authMiddleware, DebitNoteController.add);

router
    .route("/get")
    .post(authMiddleware, DebitNoteController.get);

router
    .route("/delete")
    .delete(authMiddleware, DebitNoteController.remove)


router
    .route("/filter")
    .post(authMiddleware, DebitNoteController.filter);

router
    .route("/get-purchase-invoice")
    .post(authMiddleware, DebitNoteController.getPurchase);

module.exports = router;