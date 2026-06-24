const { add, get, remove, restore, filter, getSales } = require("../controllers/creditnote.controller");
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
  .route("/get-sales-invoice")
  .post(getSales);

module.exports = router;

