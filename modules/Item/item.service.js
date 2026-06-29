const itemModel = require("./item.model");
const purchaseInvoiceModel = require("../Purchase/purchase.model");
const salesinvoiceModel = require("../Sales/sales.model");


class ItemService {
    static async isUnitEdit({ itemId, userId, activeCompany }) {
        const [purchaseUsed, salesUsed] = await Promise.all([
            purchaseInvoiceModel.exists({
                userId,
                companyId: activeCompany,
                "items.itemId": itemId
            }),
            salesinvoiceModel.exists({
                userId,
                companyId: activeCompany,
                "items.itemId": itemId
            })
        ]);

        const edit = !(purchaseUsed || salesUsed);

        return edit;
    }
}

module.exports = ItemService;