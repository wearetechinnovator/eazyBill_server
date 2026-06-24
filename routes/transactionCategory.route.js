const router = require('express').Router()
const { add, get, remove, restore } = require("../controllers/transactionCategory.controller");



router
  .route("/add")
  .post(add);

router
  .route('/get')
  .post(get);

router
  .route("/delete")
  .delete(remove);


module.exports = router;
