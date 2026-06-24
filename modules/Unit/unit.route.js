const router = require("express").Router();
const UnitController = require("./unit.controller");
const authMiddleware = require("../../middlewares/auth.middleware");


router
    .route("/add")
    .post(authMiddleware, UnitController.add);

router
    .route("/get")
    .post(authMiddleware, UnitController.get);

router
    .route("/delete")
    .delete(authMiddleware, UnitController.remove);


module.exports = router;
