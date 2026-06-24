const router = require("express").Router();
const CreditNoteController = require("./creditNote.controller");
const authMiddleware = require("../../middlewares/auth.middleware");


router
    .route("/add")
    .post(authMiddleware, CreditNoteController.add);

router
    .route("/get")
    .post(authMiddleware, CreditNoteController.get);

router
    .route("/delete")
    .delete(authMiddleware, CreditNoteController.remove)

router
    .route("/filter")
    .post(authMiddleware, CreditNoteController.filter);

router
    .route("/get-sales-invoice")
    .post(authMiddleware, CreditNoteController.getSales);

module.exports = router;