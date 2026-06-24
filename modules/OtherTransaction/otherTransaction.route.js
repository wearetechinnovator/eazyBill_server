const router = require("express").Router();
const OtherTransactionController = require("./otherTransaction.controller");
const authMiddleware = require("../../middlewares/auth.middleware");



router
    .route("/add")
    .post(authMiddleware, OtherTransactionController.add);

router
    .route('/get')
    .post(authMiddleware, OtherTransactionController.get);

router
    .route("/delete")
    .delete(authMiddleware, OtherTransactionController.remove);

router
    .route('/get-total-income-expense')
    .post(authMiddleware, OtherTransactionController.getTotalIncomeExpense);



module.exports = router;