const { add, get, remove, restore, filter, getMonthWisePaymentIn, getCashIn } = require("../controllers/paymentin.controller");
const router = require("express").Router();

router
  .route("/add")
  .post(add);

router
  .route("/get")
  .post(get);

router
  .route("/delete")
  .delete(remove);

router
  .route("/restore")
  .post(restore);


router
  .route("/filter")
  .post(filter);

router
  .route("/month-wise")
  .post(getMonthWisePaymentIn);

router
  .route("/get-cashin")
  .post(getCashIn);


module.exports = router;
