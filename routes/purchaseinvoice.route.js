const { add, get, remove, restore, filter, getTotalPay, getTotalPurchaseAmount } = require("../controllers/purchaseinvoice.controller");
const router = require("express").Router();


router
  .route("/add")
  .post(add);

router
  .route("/get")
  .post(get);

router
  .route("/delete")
  .delete(remove)


router
  .route("/restore")
  .post(restore)


router
  .route("/filter")
  .post(filter);

router
  .route("/get-total-pay")
  .post(getTotalPay);

router
  .route("/get-total-purchase-amount")
  .post(getTotalPurchaseAmount);




module.exports = router;

