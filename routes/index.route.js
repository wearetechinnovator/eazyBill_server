const router = require("express").Router();
const { chromium } = require('playwright');

const userRoute = require("./user.route");
const companyRoute = require('./company.route');
const partyRoute = require("./party.route");
const taxRoute = require("./tax.route");
const unitRoute = require('./unit.route');
const categoryRoute = require('./category.route');
const itemRoute = require('./item.route');
const quotationRoute = require('./quotation.route');
const proformaRoute = require('./proforma.route');
const poRoute = require('./po.route');
const purchaseInvoiceRoute = require("./purchaseinvoice.route");
const purchaseReturnRoute = require("./purchasereturn.route");
const debitNoteRoute = require("./debitnote.route");
const salesiInvoiceRoute = require("./salesinvoice.route");
const salesReturnRoute = require("./salesreturn.route");
const creditNoteRoute = require("./creditnote.route");
const deliveryChalan = require("./deliverychalan.route");
const paymentIn = require("./paymentin.route");
const paymentOut = require("./paymentout.route");
const accountRoute = require("./account.route");
const otherTrancationRoute = require("./transaction.route");
const partyCategoryRoute = require("./partycategory.route");
const staffRoute = require("./staff.route");
const attendanceRoute = require("./attendance.route");
const ladgerRoute = require("./ladger.route");
const transactionCategoryRoute = require("./transactionCategory.route");
const staffPaymentRoute = require("./staffPayment.route");
const tdsRateRoute = require("./tdsRate.route");
const partyContactRoute = require("./partyContact.route");
const enquiryRoute = require("./enquiry.route");



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



let browser;
let browserLaunchPromise = null;

async function getBrowser() {
  if (browser && browser.isConnected()) {
    return browser;
  }

  if (browserLaunchPromise) {
    return browserLaunchPromise;
  }

  browserLaunchPromise = chromium
    .launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--single-process',
        '--no-zygote',
      ],
    })
    .then((b) => {
      browser = b;
      browserLaunchPromise = null;

      browser.on('disconnected', () => {
        browser = null;
      });

      return browser;
    })
    .catch((err) => {
      browser = null;
      browserLaunchPromise = null;
      throw err;
    });

  return browserLaunchPromise;
}

router.post('/generate-pdf', async (req, res) => {
  let page;

  try {
    const { html } = req.body;

    if (!html) {
      return res.status(400).send('HTML is required');
    }

    // First attempt
    let browserInstance;
    try {
      browserInstance = await getBrowser();
      page = await browserInstance.newPage({
        viewport: {
          width: 1280,
          height: 720,
        },
      });
    } catch (err) {
      // Browser crash hua, force fresh browser aur retry
      console.warn('First attempt failed, retrying with fresh browser...', err.message);
      browser = null;
      browserLaunchPromise = null;
      browserInstance = await getBrowser();
      page = await browserInstance.newPage({
        viewport: {
          width: 1280,
          height: 720,
        },
      });
    }

    // <link
    //         href="https://fonts.googleapis.com/css2?family=Poppins:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&display=swap"
    //         rel="stylesheet"
    //       />
    await page.setContent(
      `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8" />

          <link
            href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css"
            rel="stylesheet"
          />
          <link
            href="https://fonts.googleapis.com/css2?family=Nunito+Sans:ital,opsz,wght@0,6..12,200..1000;1,6..12,200..1000&display=swap"
            rel="stylesheet"
          />

          <style>
          * {
              box-sizing: border-box;
              font-family: "Nunito Sans", sans-serif;
              font-style: normal;
            }
            body{
              margin:0;
              padding:0;
            }

            #invoice{
              font-size: 13px !important;
            }

            p + p {
              margin-top: 8px;
            }

            #invoice tr td:not(.invoice__header tr td)  {
              border: 0.3px solid #d1d5db;
              padding: 3px;
              color: black;
              font-size: 10px;
              page-break-inside: avoid;
              line-height: 10px;
            }
            .item__table__body .item__row td{
              border: none !important;
              background-color: rgba(245, 245, 245, 0.438);
              border-top: 1px solid rgb(236, 235, 235) !important;
            }

            #invoice thead td {
              white-space: nowrap;
              font-weight: 500;
              overflow: visible;
            }

            /* Fix bill info section — reduce font weight */
            .invoice__header td {
              font-weight: 400 !important;
            }

            .invoice__header table td {
              font-weight: 400;
            }

            .item__table {
              table-layout: fixed;
            }

            .table__wrapper table {
              page-break-inside: avoid;
            }

            .item__table tr td {
              word-wrap: break-word;
            }

            .table__wrapper table.item__table tfoot {
              margin-top: auto;
            }

            table.item__table td {
              max-width: 80mm;
              word-wrap: break-word;
            }

            .discount-font {
              font-size: 8px;
            }

            .cancel__invoice {
              position: absolute;
              color: rgba(255, 0, 0, 0.295);
              text-transform: uppercase;
              font-size: 7rem;
              transform: rotate(-50deg);
              top: 220px;
              left: 90px;
            }

            @page {
              margin: 10mm;
            }
          </style>
        </head>

        <body>
          ${html}
        </body>
      </html>
      `,
      {
        waitUntil: 'networkidle',
        timeout: 60000,
      }
    );

    await page.emulateMedia({
      media: 'print',
    });

    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      preferCSSPageSize: true,
    });

    res.setHeader('Content-Type', 'application/pdf');

    res.setHeader(
      'Content-Disposition',
      'attachment; filename=invoice.pdf'
    );

    res.setHeader('Content-Length', pdfBuffer.length);

    return res.end(pdfBuffer);

  } catch (error) {
    return res.status(500).send('Failed to generate PDF');

  } finally {
    if (page) {
      try {
        await page.close();
      } catch (err) {
        console.warn('Page close error (ignored):', err.message);
      }
    }
  }
});




module.exports = router;