const { add, get, remove, restore, getBalance } = require("../controllers/account.controller");
const router = require("express").Router();


router
  .route("/add")
  .post(add);

router
  .route('/get')
  .post(get);

router
  .route("/delete")
  .delete(remove);

router
  .route('/restore')
  .post(restore)

router
  .route("/get-balance")
  .post(getBalance);


module.exports = router;
