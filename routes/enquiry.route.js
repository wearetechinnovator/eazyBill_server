const EnquiryController = require("../controllers/enquiry.controller");
const router = require("express").Router();



router
    .route("/add")
    .post(EnquiryController.addEnquiry);

router
    .route("/update")
    .patch(EnquiryController.updateEnquiry);

router
    .route("/delete")
    .delete(EnquiryController.deleteEnquiry);

router
    .route("/get")
    .post(EnquiryController.getSingleEnquiry);

router
    .route("/get-enqno")
    .post(EnquiryController.getEnquiryNo);

router
    .route("/get-all")
    .post(EnquiryController.getAllEnquiry);


module.exports = router;
