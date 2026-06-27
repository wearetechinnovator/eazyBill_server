const { default: mongoose } = require('mongoose');
const bwipjs = require('bwip-js');
const fs = require('fs');
const path = require('path');
const { getId } = require("../../helper/getIdFromToken");
const itemModel = require("./item.model");
const userModel = require("../User/user.model");
const purchaseInvoiceModel = require("../Purchase/purchase.model");
const purchaseReturModel = require("../PurchaseReturn/purchaseReturn.model");
const salesinvoiceModel = require("../Sales/sales.model");
const salesReturnModel = require("../SalesReturn/salesReturn.model");


class ItemController {
    // Add controller;
    static async add(req, res) {
        const { token, title, type, salePrice, category, details, update, id, unit, stock, hsn,
            purchasePrice, purchaseTaxType, saleTaxType, tax, itemCode
        } = req.body;

        if ([token, title, salePrice,].some(field => !field || field === "")) {
            return res.json({ err: 'require fields are empty', create: false });
        }

        if (!unit.length || unit.some(u => !u.unit || !u.conversion)) {
            return res.status(500).json({ err: 'Unit is required', create: false });
        }


        try {
            const getInfo = await getId(token);
            const getUserData = await userModel.findOne({ _id: getInfo._id });

            const isExist = await itemModel.findOne({ title, companyId: getUserData.activeCompany, isDel: false });
            if (isExist && !update) {
                return res.status(500).json({ err: 'Item alredy exist', create: false, isDel: false })
            }

            // update code.....
            if (update && id) {
                const update = await itemModel.updateOne({ _id: id }, {
                    $set: {
                        title, type, salePrice, category: category || null, details, unit, hsn,
                        purchasePrice, purchaseTaxType, saleTaxType, tax, itemCode
                    }
                })

                if (!update) {
                    return res.status(500).json({ err: 'Item update failed', update: false })
                }

                return res.status(200).json(update)

            } // Update close here;


            let openingStock = [];
            let stockAlert = [];
            if (!update) {
                unit.forEach(u => {
                    openingStock.push({
                        unit: u.unit,
                        stock: u.opening
                    })

                    stockAlert.push({
                        unit: u.unit,
                        alert: u.alert
                    })
                })
            }


            // ===========[Generate Barcode]=========;
            if (itemCode) {
                const baseFolder = path.join(__dirname, '..', 'barcodes');
                const barcodePath = path.join(__dirname, '..', 'barcodes', `${itemCode}.png`);

                if (!fs.existsSync(baseFolder)) {
                    fs.mkdirSync(baseFolder);
                }

                bwipjs.toBuffer({
                    bcid: 'code128',
                    text: itemCode,
                    scale: 1,
                    height: 5,
                    // includetext: true,
                    // textxalign: 'center',
                    // textgapsp: 5,
                }, (err, png) => {
                    if (err) {
                        console.error(err);
                    } else {
                        fs.writeFileSync(barcodePath, png);
                    }
                });
            }



            const insert = await itemModel.create({
                userId: getUserData._id, companyId: getUserData.activeCompany, hsn,
                purchasePrice, purchaseTaxType, saleTaxType,
                title, type, salePrice, category: category || null, details, unit,
                stock: openingStock, alert: stockAlert, tax, itemCode,
                barcodeImage: `/barcodes/${itemCode}.png`
            });

            if (!insert) {
                return res.status(500).json({ err: 'Item creation failed', create: false })
            }


            return res.status(200).json(insert);

        } catch (error) {
            console.log(error)
            return res.status(500).json({ 'err': 'Something went wrong', create: false });
        }
    }

    // get Controller
    static async get(req, res) {
        const { token, id, all, search, searchText, barCode } = req.body;
        const { page = 1, limit = 10 } = req.query;

        const skip = (Number(page) - 1) * Number(limit);

        if (!token) {
            return res.status(500).json({
                err: "Invalid user",
                get: false
            });
        }

        try {

            // =========================================================
            // USER
            // =========================================================

            const getInfo = await getId(token);

            const getUser = await userModel.findOne({
                _id: getInfo._id
            });

            // =========================================================
            // TOTAL DATA
            // =========================================================

            const totalData = await itemModel.countDocuments({
                companyId: getUser.activeCompany,
                isDel: false
            });

            // =========================================================
            // FILTER
            // =========================================================

            let getData;
            let filter = {};

            if (!search && searchText) {
                filter.$or = [
                    {
                        title: {
                            $regex: searchText.trim(),
                            $options: "i"
                        }
                    },
                    {
                        hsn: {
                            $regex: searchText.trim(),
                            $options: "i"
                        }
                    }
                ];
            }

            // =========================================================
            // GET DATA
            // =========================================================

            if (id) {

                getData = await itemModel.findOne({
                    companyId: getUser.activeCompany,
                    _id: id,
                    isDel: false
                }).populate("category");

            }
            else if (barCode) {

                getData = await itemModel.findOne({
                    companyId: getUser.activeCompany,
                    itemCode: barCode,
                    isTrash: false,
                    isDel: false
                }).populate("category");

            }
            else if (all) {

                getData = await itemModel.find({
                    companyId: getUser.activeCompany,
                    isDel: false
                })
                    .skip(skip)
                    .limit(limit)
                    .populate("category")
                    .sort({ _id: -1 });

            }
            else if (search) {

                if (searchText.trim() !== "") {

                    getData = await itemModel.find({
                        title: {
                            $regex: searchText.trim(),
                            $options: "i"
                        },
                        companyId: getUser.activeCompany,
                        isDel: false
                    })
                        .sort({ _id: -1 })
                        .select("_id title");

                }

            }
            else {

                getData = await itemModel.find({
                    companyId: getUser.activeCompany,
                    isDel: false,
                    ...filter
                })
                    .skip(skip)
                    .limit(limit)
                    .populate("category")
                    .sort({ _id: -1 });

            }

            if (!getData) {
                return res.status(500).json({
                    err: "No item available",
                    get: false
                });
            }

            // =========================================================
            // FORCE ARRAY
            // =========================================================

            const items = Array.isArray(getData) ? getData : [getData];

            // =========================================================
            // STOCK CALCULATION
            // =========================================================

            const results = [];

            for (const item of items) {
                const unitSizeInSmallest = {};

                const units = item.unit || [];

                let multiplier = 1;

                for (let i = units.length - 1; i >= 0; i--) {

                    const current = units[i];

                    unitSizeInSmallest[current.unit] = multiplier;

                    if (i > 0) {
                        multiplier *= Number(current.conversion || 1);
                    }
                }

                // =====================================================
                // OPENING STOCK
                // =====================================================

                let openingSmallest = 0;

                for (const u of units) {

                    const qty = Number(u.opening || 0);

                    const size = unitSizeInSmallest[u.unit] || 1;

                    openingSmallest += qty * size;

                }

                // =====================================================
                // PURCHASE
                // =====================================================

                let purchaseSmallest = 0;

                const purchaseInv = await purchaseInvoiceModel.find({
                    "items.itemId": item._id.toString(),
                    isDel: false
                });

                for (const inv of purchaseInv) {

                    for (const pItem of inv.items || []) {

                        if (String(pItem.itemId) !== String(item._id)) {
                            continue;
                        }

                        const qty = Number(pItem.qun || 0);

                        const size =
                            unitSizeInSmallest[pItem.selectedUnit] || 1;

                        purchaseSmallest += qty * size;

                    }

                }

                // =====================================================
                // PURCHASE RETURN
                // =====================================================

                let purchaseReturnSmallest = 0;

                const purchaseReturnInv = await purchaseReturModel.find({
                    "items.itemId": item._id.toString(),
                    isDel: false
                });

                for (const inv of purchaseReturnInv) {

                    for (const pItem of inv.items || []) {

                        if (String(pItem.itemId) !== String(item._id)) {
                            continue;
                        }

                        const qty = Number(pItem.qun || 0);

                        const size =
                            unitSizeInSmallest[pItem.selectedUnit] || 1;

                        purchaseReturnSmallest += qty * size;

                    }

                }

                // =====================================================
                // SALES
                // =====================================================

                let salesSmallest = 0;

                const salesInv = await salesinvoiceModel.find({
                    "items.itemId": item._id.toString(),
                    isDel: false,
                    isCancel: false
                });

                for (const inv of salesInv) {

                    for (const sItem of inv.items || []) {

                        if (String(sItem.itemId) !== String(item._id)) {
                            continue;
                        }

                        const qty = Number(sItem.qun || 0);

                        const size =
                            unitSizeInSmallest[sItem.selectedUnit] || 1;

                        salesSmallest += qty * size;

                    }

                }

                // =====================================================
                // SALES RETURN
                // =====================================================

                let salesReturnSmallest = 0;

                const salesReturnInv = await salesReturnModel.find({
                    "items.itemId": item._id.toString(),
                    isDel: false
                });

                for (const inv of salesReturnInv) {

                    for (const sItem of inv.items || []) {

                        if (String(sItem.itemId) !== String(item._id)) {
                            continue;
                        }

                        const qty = Number(sItem.qun || 0);

                        const size =
                            unitSizeInSmallest[sItem.selectedUnit] || 1;

                        salesReturnSmallest += qty * size;

                    }

                }

                // =====================================================
                // FINAL TOTAL
                // =====================================================

                const totalSmallestUnits =
                    openingSmallest
                    + purchaseSmallest
                    - purchaseReturnSmallest
                    - salesSmallest
                    + salesReturnSmallest;

                // =====================================================
                // CONVERT BACK TO UNITS
                // =====================================================

                const sortedUnits = Object.keys(unitSizeInSmallest)
                    .sort(
                        (a, b) =>
                            unitSizeInSmallest[b] -
                            unitSizeInSmallest[a]
                    );

                let remaining = totalSmallestUnits;

                const stockObj = {};

                for (const unitName of sortedUnits) {
                    const size = unitSizeInSmallest[unitName];

                    const qty = Math.floor(remaining / size);

                    stockObj[unitName] = qty;

                    remaining -= qty * size;

                }

                // =====================================================
                // PUSH RESULT
                // =====================================================

                results.push({
                    itemId: item._id,
                    title: item.title,
                    totalSmallestUnits,
                    stock: stockObj
                });

            }


            // =========================================================
            // RESPONSE
            // =========================================================
            return res.status(200).json({
                data: getData,
                totalData,
                stock: results
            });

        }
        catch (error) {
            return res.status(500).json({
                err: "Something went wrong",
                get: false
            });

        }
    };

    // Delete controller;
    static async remove(req, res) {
        const { ids, trash } = req.body;


        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({ err: "No valid ids provided", remove: false });
        }

        try {
            let updateQuery;
            if (trash) {
                updateQuery = { $set: { isTrash: true } };
            } else {
                updateQuery = { $set: { isDel: true } };
            }

            const removeData = await itemModel.updateMany(
                { _id: { $in: ids } },
                updateQuery
            );

            if (removeData.matchedCount === 0) {
                return res.status(404).json({ err: "No matching item found", remove: false });
            }

            return res.status(200).json({
                msg: trash
                    ? "Item successfully trash"
                    : "Item successfully delete",
                modifiedCount: removeData.modifiedCount,
            });

        } catch (error) {
            console.log(error)
            return res.status(500).json({ err: "Something went wrong", remove: false });
        }
    };


    static async getPurchaseInvoice(req, res) {
        const { itemId, update } = req.body;
        const userData = req.data;

        if (!itemId) {
            return res.status(401).json({ err: 'require token and item id' });
        }

        try {
            const getUser = await userModel.findOne({ _id: userData._id });

            /**
            * If bill is open in edit mode,
            * tokhon previous tag show kora te hobe,
            * kintu jodi remining > 0 kore rakhi tahole jodi qun ses hoye jay taile edit mode
            * kichu show hobe na. tai update mode a remainingQun check korar dorkar nai.
            */
            const remainingCondition = update
                ? {}
                : { $gt: [{ $toDouble: "$$item.remainingQun" }, 0] };

            const invoice = await purchaseInvoiceModel.aggregate([
                {
                    $match: {
                        userId: new mongoose.Types.ObjectId(String(userData._id)),
                        companyId: new mongoose.Types.ObjectId(String(getUser.activeCompany)),
                        "items.itemId": itemId
                    }
                },
                {
                    $addFields: {
                        items: {
                            $filter: {
                                input: "$items",
                                as: "item",
                                cond: {
                                    $and: [
                                        { $eq: ["$$item.itemId", itemId] },
                                        ...(update ? [] : [
                                            // ✅ String compare — "0" se bada
                                            {
                                                $gt: [
                                                    { $toDouble: { $ifNull: ["$$item.remainingQun", "0"] } },
                                                    0
                                                ]
                                            }
                                        ])
                                    ]
                                }
                            }
                        }
                    }
                },
                {
                    $match: {
                        "items.0": { $exists: true }
                    }
                }
            ]);

            return res.status(200).json(invoice);

        } catch (error) {
            console.error(error);
            return res.status(500).json({ err: "Something went wrong" });
        }
    }
}

module.exports = ItemController