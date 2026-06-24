const { add, get } = require('../controllers/tdsRate.controller');
const router = require('express').Router()


router
  .route("/add")
  .post(add);

router
  .route("/get")
  .post(get);

module.exports = router;