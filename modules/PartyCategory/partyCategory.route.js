const router = require("express").Router();
const PartyCategoryController = require("./partyCategory.controller");
const authMiddleware = require("../../middlewares/auth.middleware");


router
    .route("/add")
    .post(authMiddleware, PartyCategoryController.add);


router
    .route("/get")
    .post(authMiddleware, PartyCategoryController.get);


router
    .route("/delete")
    .delete(authMiddleware, PartyCategoryController.remove)



module.exports = router;