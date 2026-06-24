const router = require('express').Router()
const {
  add, get, remove, restore,
  getTotalIncomeExpense
} = require("../controllers/transaction.controller")



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
  .post(restore);

router
  .route('/get-total-income-expense')
  .post(getTotalIncomeExpense);




module.exports = router;