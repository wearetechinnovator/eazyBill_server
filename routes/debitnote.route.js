const { add, get, remove, restore, filter, getPurchase } = require("../controllers/debitnote.controller");
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
  .route("/get-purchase-invoice")
  .post(getPurchase);

module.exports = router;

