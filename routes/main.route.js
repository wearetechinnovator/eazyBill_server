const router = require("express").Router();
const { chromium } = require('playwright');


const userRoute = require("../modules/User/user.route");
const companyRoute = require('../modules/Company/company.rotue');
const partyRoute = require("../modules/Party/party.route");
const taxRoute = require("../modules/Tax/tax.route");
const unitRoute = require('../modules/Unit/unit.route');
const categoryRoute = require('../modules/ItemCategory/itemCategory.route');
const itemRoute = require('../modules/Item/item.route');
const quotationRoute = require('../modules/Quotation/quotation.route');
const proformaRoute = require('../modules/Proforma/proforma.route');
const poRoute = require('../modules/PO/po.route');
const purchaseInvoiceRoute = require("../modules/Purchase/purchase.route");
const purchaseReturnRoute = require("../modules/PurchaseReturn/purchaseReturn.route");
const debitNoteRoute = require("../modules/Debitnote/debitNote.route");
const salesiInvoiceRoute = require("../modules/Sales/sales.route");
const salesReturnRoute = require("../modules/SalesReturn/salesReturn.route");
const creditNoteRoute = require("../modules/CreditNote/creditNote.route");
const deliveryChalan = require("../modules/DeliveryChalan/chalan.route");
const paymentIn = require("../modules/PaymentIn/paymentIn.route");
const paymentOut = require("../modules/PaymentOut/paymentOut.route");
const accountRoute = require("../modules/Account/account.route");
const otherTrancationRoute = require("../modules/OtherTransaction/otherTransaction.route");
const partyCategoryRoute = require("../modules/PartyCategory/partyCategory.route");
const staffRoute = require("../modules/Staff/staff.route");
const attendanceRoute = require("../modules/Attendance/attendance.route");
const ladgerRoute = require("../modules/Ladger/ladger.route");
const transactionCategoryRoute = require("../modules/OtherTransactionCategory/otherTransactionCategory.route");
const staffPaymentRoute = require("../modules/StaffPayment/staffPayment.route");
const tdsRateRoute = require("../modules/TdsRate/tdsRate.route");
const partyContactRoute = require("../modules/PartyContact/partyContact.route");
const enquiryRoute = require("../modules/Enquiry/enquiry.route");
const rerpotRoute = require("../modules/Report/report.route");



router.use("/user/", userRoute);
router.use("/company/", companyRoute);
router.use("/party/", partyRoute);
router.use("/tax/", taxRoute);
router.use("/unit/", unitRoute);
router.use("/category/", categoryRoute);
router.use("/item/", itemRoute);
router.use("/quotation/", quotationRoute);
router.use("/proforma/", proformaRoute);
router.use("/po/", poRoute);
router.use("/purchaseinvoice/", purchaseInvoiceRoute);
router.use("/purchasereturn/", purchaseReturnRoute);
router.use("/debitnote/", debitNoteRoute);
router.use("/salesinvoice/", salesiInvoiceRoute);
router.use('/salesreturn/', salesReturnRoute);
router.use('/creditnote/', creditNoteRoute);
router.use('/deliverychalan/', deliveryChalan);
router.use('/paymentin/', paymentIn);
router.use('/paymentout/', paymentOut);
router.use('/account/', accountRoute);
router.use("/other-transaction/", otherTrancationRoute);
router.use("/transaction-category/", transactionCategoryRoute);
router.use("/partycategory/", partyCategoryRoute);
router.use("/staff/", staffRoute);
router.use("/attendance/", attendanceRoute);
router.use("/ladger/", ladgerRoute);
router.use("/staff-payment/", staffPaymentRoute);
router.use("/tds-rate/", tdsRateRoute);
router.use("/party-contacts/", partyContactRoute);
router.use("/enquiry/", enquiryRoute);
router.use("/report/", rerpotRoute);



module.exports = router;