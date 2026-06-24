const router = require("express").Router();
const CompanyController = require("./company.controller");
const authMiddleware = require("../../middlewares/auth.middleware")


router
    .route('/add')
    .post(authMiddleware, CompanyController.add);

router
    .route("/switch-company")
    .post(authMiddleware, CompanyController.switchCompany);

router
    .route('/get')
    .post(authMiddleware, CompanyController.get);



module.exports = router;
