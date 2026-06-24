const router = require("express").Router();
const ProformaController = require("./proforma.controller");
const authMiddleware = require("../../middlewares/auth.middleware");


router
    .route("/add")
    .post(authMiddleware, ProformaController.add);

router
    .route("/get")
    .post(authMiddleware, ProformaController.get);

router
    .route("/delete")
    .delete(authMiddleware, ProformaController.remove)

router
    .route("/filter")
    .post(authMiddleware, ProformaController.filter)


module.exports = router;