const router = require("express").Router();
const ReportController = require("./report.controller");
const authMiddleware = require("../../middlewares/auth.middleware");



router
    .route("/daybook")
    .post(authMiddleware, ReportController.dayBook);




module.exports = router;