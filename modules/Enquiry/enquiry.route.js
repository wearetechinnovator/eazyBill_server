const router = require("express").Router();
const EnquiryController = require("./enquiry.controller");
const authMiddleware = require("../../middlewares/auth.middleware")



router
    .route("/add")
    .post(authMiddleware, EnquiryController.addEnquiry);

router
    .route("/update")
    .patch(authMiddleware, EnquiryController.updateEnquiry);

router
    .route("/delete")
    .delete(authMiddleware, EnquiryController.deleteEnquiry);

router
    .route("/get")
    .post(authMiddleware, EnquiryController.getSingleEnquiry);

router
    .route("/get-enqno")
    .post(authMiddleware, EnquiryController.getEnquiryNo);

router
    .route("/get-all")
    .post(authMiddleware, EnquiryController.getAllEnquiry);


module.exports = router;