const router = require("express").Router();
const PoController = require("./po.controller");
const authMiddleware = require("../../middlewares/auth.middleware");


router
    .route("/add")
    .post(authMiddleware, PoController.add);

router
    .route("/get")
    .post(authMiddleware, PoController.get);

router
    .route("/delete")
    .delete(authMiddleware, PoController.remove)

router
    .route("/filter")
    .post(authMiddleware, PoController.filter);



module.exports = router;