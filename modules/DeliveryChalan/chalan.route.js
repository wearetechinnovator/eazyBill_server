const router = require("express").Router();
const ChalanController = require("./chalan.controller");
const authMiddleware = require("../../middlewares/auth.middleware")


router
    .route("/add")
    .post(authMiddleware, ChalanController.add);

router
    .route("/get")
    .post(authMiddleware, ChalanController.get);

router
    .route("/delete")
    .delete(authMiddleware, ChalanController.remove)

router
    .route("/filter")
    .post(authMiddleware, ChalanController.filter);



module.exports = router;