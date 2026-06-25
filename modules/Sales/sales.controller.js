const { default: mongoose } = require('mongoose');
const { getId } = require('../../helper/getIdFromToken');
const Log = require('../../helper/insertLog');
const salesInvoiceModel = require('./sales.model');
const userModel = require('../User/user.model');
const paymentinModel = require("../PaymentIn/paymentIn.model");
const companyModel = require('../Company/company.model');
const { updateLadger, addLadger } = require('../Ladger/ladger.controller');
const partyModel = require('../Party/party.model');
const itemSettlementModel = require("../Item/itemSattlement.model");
const purchaseInvoiceModel = require("../Purchase/purchase.model");



class SalesController {
    static updatePurchaseItemRemining = async ({ items, userId, companyId, salesBillId }) => {
        try {
            const itemIds = [...new Set(items.map(i => String(i.itemId)))];
            const settlementMap = {};

            const allPurchaseInvoices = await purchaseInvoiceModel.find({
                userId: new mongoose.Types.ObjectId(String(userId)),
                companyId: new mongoose.Types.ObjectId(String(companyId)),
                items: {
                    $elemMatch: {
                        itemId: { $in: itemIds },
                        remainingQun: { $gt: 0 }
                    }
                }
            });

            for (const item of items) {
                let reqQty = Number(item.qun);
                const settlementInv = item.settleInvoice || [];
                const itemSettlements = []; // this item er jonno

                // |========================================|
                // |====[USER SELECTED PURCHASE INVOICES]===|
                // |========================================|
                if (settlementInv.length > 0) {
                    for (const invId of settlementInv) {
                        if (reqQty <= 0) break;

                        const invoice = allPurchaseInvoices.find(inv => String(inv._id) === String(invId));

                        if (!invoice) continue;

                        const purchaseItem = invoice.items.find(
                            p => String(p.itemId) === String(item.itemId) && Number(p.remainingQun) > 0
                        );

                        if (!purchaseItem) continue;

                        const remaining = Number(purchaseItem.remainingQun);

                        const deductQty = Math.min(reqQty, remaining);
                        const newRemaining = remaining - deductQty;

                        const updateResult = await purchaseInvoiceModel.updateOne(
                            {
                                _id: invoice._id,
                                userId: new mongoose.Types.ObjectId(
                                    String(userId)
                                ),
                                companyId: new mongoose.Types.ObjectId(
                                    String(companyId)
                                ),
                                "items.itemId": String(item.itemId)
                            },
                            {
                                $set: {
                                    "items.$.remainingQun": String(newRemaining)
                                }
                            }
                        );

                        if (updateResult.modifiedCount !== 1) {
                            return {
                                status: false,
                                message: `Failed to update stock for ${item.itemName}`
                            };
                        }

                        // Update memory copy
                        purchaseItem.remainingQun = newRemaining;

                        itemSettlements.push({
                            purchaseBillId: invoice._id,
                            settleQun: deductQty,
                            unit: item.selectedUnit
                        });

                        reqQty -= deductQty;
                    }

                }

                // |========================================|
                // |===========[FIFO SETTLEMENT]============|
                // |========================================|
                else {
                    // Jar itemId current itemId, and jar reminingQun besi 0 er theke;
                    // Take sort kora holo invoiceDate hisebe.
                    const fifoInvoices = allPurchaseInvoices
                        .filter(inv =>
                            inv.items.some(
                                p => String(p.itemId) === String(item.itemId) && Number(p.remainingQun) > 0
                            )
                        ).sort((a, b) => new Date(a.invoiceDate) - new Date(b.invoiceDate));

                    for (const invoice of fifoInvoices) {
                        if (reqQty <= 0) break; // useless; tule dilo o osubidha nai

                        const purchaseItem = invoice.items.find(p =>
                            String(p.itemId) === String(item.itemId) &&
                            Number(p.remainingQun) > 0
                        );

                        if (!purchaseItem) continue;

                        const remaining = Number(purchaseItem.remainingQun);

                        const deductQty = Math.min(reqQty, remaining);
                        const newRemaining = remaining - deductQty;

                        const updateResult = await purchaseInvoiceModel.updateOne(
                            {
                                _id: invoice._id,
                                userId: new mongoose.Types.ObjectId(
                                    String(userId)
                                ),
                                companyId: new mongoose.Types.ObjectId(
                                    String(companyId)
                                ),
                                "items.itemId": String(item.itemId)
                            },
                            {
                                $set: {
                                    "items.$.remainingQun": String(newRemaining)
                                }
                            }
                        );

                        if (updateResult.modifiedCount !== 1) {
                            return {
                                status: false,
                                message: `Failed to update stock for ${item.itemName}`
                            };
                        }

                        // Update memory copy
                        purchaseItem.remainingQun = newRemaining;

                        itemSettlements.push({
                            purchaseBillId: invoice._id,
                            settleQun: deductQty,
                            unit: item.selectedUnit
                        });

                        reqQty -= deductQty;

                    }

                }

                settlementMap[String(item.itemId)] = itemSettlements;

            }

            await itemSettlementModel.insertMany(
                items.map(i => ({
                    userId,
                    companyId,
                    itemId: i.itemId,
                    settlement: settlementMap[String(i.itemId)] || [],
                    salesBillId
                }))
            );

            return {
                status: true,
                message: "Purchase quantities settled successfully"
            };
        } catch (error) {
            console.error(error);
            return {
                status: false,
                message: error.message || "Failed to settle purchase quantities"
            };
        }
    };

    static updatePurchaseItemRemainingOnUpdate = async ({ newItems, userId, companyId, salesBillId }) => {
        try {
            // |========================================|
            // |=======[STEP 1: RESTORE OLD QTY]========|
            // |========================================|
            const oldSettlements = await itemSettlementModel.find({
                userId, companyId, salesBillId
            });

            for (const settlement of oldSettlements) {
                for (const s of settlement.settlement) {
                    const invoice = await purchaseInvoiceModel.findOne({
                        _id: s.purchaseBillId,
                        userId: new mongoose.Types.ObjectId(String(userId)),
                        companyId: new mongoose.Types.ObjectId(String(companyId)),
                    });

                    if (!invoice) continue;

                    const purchaseItem = invoice.items.find(
                        p => String(p.itemId) === String(settlement.itemId)
                    );

                    if (!purchaseItem) continue;

                    // ✅ String -> Number convert করে তারপর restore
                    const currentRemaining = Number(purchaseItem.remainingQun);
                    const restored = currentRemaining + Number(s.settleQun);

                    await purchaseInvoiceModel.updateOne(
                        {
                            _id: s.purchaseBillId,
                            userId: new mongoose.Types.ObjectId(String(userId)),
                            companyId: new mongoose.Types.ObjectId(String(companyId)),
                            "items.itemId": String(settlement.itemId)
                        },
                        {
                            $set: { "items.$.remainingQun": String(restored) }
                        }
                    );
                }
            }

            // Delete old settlements
            await itemSettlementModel.deleteMany({ salesBillId, userId, companyId });

            // |========================================|
            // |=======[STEP 2: APPLY NEW QTY]==========|
            // |========================================|
            const result = await SalesController.updatePurchaseItemRemining({
                items: newItems,
                userId,
                companyId,
                salesBillId
            });

            return result;

        } catch (error) {
            console.error(error);
            return {
                status: false,
                message: error.message || "Failed to update purchase quantities on edit"
            };
        }
    };


    static async add(req, res) {
        const {
            token, party, salesInvoiceNumber, invoiceDate, DueDate, items, discountType,
            discountAmount, discountPercentage, additionalCharge, note, terms, update, id,
            paymentStatus, paymentAccount, paymentType, paymentAmount, finalAmount,
            accountId, autoRoundOff, roundOffAmount, roundOffType, poNumber, poDate,
        } = req.body;


        if ([token, party, salesInvoiceNumber, invoiceDate, items]
            .some(field => !field || field === '')) {
            return res.status(400).json({ err: 'fill the blank' });
        }


        try {
            const getInfo = await getId(token);
            const getUserData = await userModel.findOne({ _id: getInfo._id });

            const isExist = await salesInvoiceModel.findOne({
                userId: getInfo._id, companyId: getUserData.activeCompany,
                salesInvoiceNumber: salesInvoiceNumber,
                isDel: false
            });
            if (isExist && !update) {
                return res.status(500).json({ err: 'Invoice already exist' })
            }

            // update code.....
            if (update && id) {
                const update = await salesInvoiceModel.updateOne({ _id: id }, {
                    $set: {
                        party, salesInvoiceNumber, invoiceDate, DueDate, items, accountId: accountId || null,
                        discountType, discountAmount, discountPercentage, additionalCharge, note, terms,
                        paymentStatus, paymentAccount, paymentType, paymentAmount, finalAmount,
                        autoRoundOff, roundOffAmount, roundOffType, poNumber, poDate
                    }
                })

                if (update.modifiedCount === 0) {
                    return res.status(500).json({ err: 'Invoice update failed', update: false })
                }

                const updatePurchaseRemainingItem = await SalesController.updatePurchaseItemRemainingOnUpdate({
                    newItems: items,
                    userId: getUserData._id,
                    companyId: getUserData.activeCompany,
                    salesBillId: id
                });


                await updateLadger({
                    partyId: party,
                    voucher: 'sales',
                    voucherId: id,
                    date: invoiceDate,
                    debit: (finalAmount - (paymentAmount || 0)).toFixed(2)
                })

                return res.status(200).json(update)
            } // Update close here;


            let company = await companyModel.findOne({ _id: getUserData.activeCompany });
            const getInvPrefix = parseInt(company.invoiceNextCount) + 1;
            await companyModel.updateOne({ _id: getUserData.activeCompany }, {
                $set: {
                    invoiceNextCount: getInvPrefix
                }
            })


            const insert = await salesInvoiceModel.create({
                userId: getUserData._id, companyId: getUserData.activeCompany,
                party, salesInvoiceNumber, invoiceDate, DueDate, items, accountId,
                discountType, discountAmount, discountPercentage, additionalCharge, note, terms,
                paymentStatus, paymentAccount, paymentType, paymentAmount, finalAmount,
                autoRoundOff, roundOffAmount, roundOffType, poNumber, poDate
            });


            if (!insert) {
                return res.status(500).json({ err: 'Invoice creation failed' });
            }

            // Update Purchase Item reminig QTY;
            const updatePurchaseReminigItem = await SalesController.updatePurchaseItemRemining({
                items: items,
                userId: getUserData._id,
                companyId: getUserData.activeCompany,
                salesBillId: insert._id
            })

            if (!updatePurchaseReminigItem.status) {
                await salesInvoiceModel.deleteOne({ _id: insert._id });
                return res.status(500).json({ err: updatePurchaseReminigItem.message });
            }


            await addLadger({
                token: token,
                partyId: party,
                voucher: 'sales',
                voucherId: insert._id,
                date: invoiceDate,
                debit: (finalAmount - (paymentAmount || 0)).toFixed(2)
            })


            return res.status(200).json(insert);

        } catch (err) {
            console.log(err);
            return res.status(500).json({ err: 'Something went wrong' });
        }

    };

    // Get Controller;
    static async get(req, res) {
        const {
            token, id, all, invoice, party,
            startDate, endDate, billNo, partyName
        } = req.body;
        const { page, limit } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);

        if (!token) {
            return res.status(500).json({ 'err': 'Invalid user', get: false });
        }

        try {
            const getInfo = await getId(token);
            const getUser = await userModel.findOne({ _id: getInfo._id });
            const totalData = await salesInvoiceModel.countDocuments({
                companyId: getUser.activeCompany,
                isDel: false
            });

            // paymentin ::::::::::::::::::::::::::::::::::::
            let totalPaymentAmount = 0;
            let totalDueAmount = 0;

            const paymentIn = await paymentinModel.find({
                companyId: getUser.activeCompany,
                isDel: false
            }).sort({ _id: -1 }).select('amount -_id');

            if (paymentIn.length > 0) {
                paymentIn.map((d, i) => {
                    totalPaymentAmount += parseFloat(d.amount);
                })
            }

            let getData;
            let filter = {};
            if (startDate && endDate) {
                filter.invoiceDate = {
                    $gte: new Date(startDate),
                    $lte: new Date(endDate)
                }
            }

            if (billNo) {
                filter.salesInvoiceNumber = billNo
            }
            if (partyName) {
                const parties = await partyModel.find({
                    name: new RegExp(`${partyName}`, "i")
                }).select("_id");

                const partyIds = parties.map(p => p._id);

                filter.party = { $in: partyIds };
            }



            if (id) {
                getData = await salesInvoiceModel.findOne({
                    companyId: getUser.activeCompany,
                    _id: id,
                    isDel: false
                }).populate("party").populate('accountId');
            }
            else if (all) {
                getData = await salesInvoiceModel.find({
                    companyId: getUser.activeCompany,
                    isDel: false,
                    ...filter
                }).skip(skip).limit(limit).sort({ _id: -1 }).populate('party');
            }
            else if (invoice) {
                getData = await salesInvoiceModel.find({
                    companyId: getUser.activeCompany,
                    party: party || null,
                    isDel: false,
                    isCancel: false,
                    $expr: { $ne: ["$finalAmount", "$paymentAmount"] },
                }).sort({ _id: -1 });
            }
            else {
                getData = await salesInvoiceModel.find({
                    companyId: getUser.activeCompany,
                    isDel: false,
                    ...filter,
                }).skip(skip).limit(limit).sort({ _id: -1 }).populate('party');
            }

            if (!getData) {
                return res.status(500).json({ 'err': 'No Invoice availble', get: false });
            }


            if (getData?.length > 0) {
                getData.map((d, i) => {
                    if (typeof d.dueAmount === 'string' && isNaN(parseInt(d.dueAmount)) === false) {
                        totalDueAmount += parseFloat(d.dueAmount);
                    }
                })
            }


            return res.status(200).json({ data: getData, totalData: totalData, totalPaymentAmount, totalDueAmount });

        } catch (error) {
            return res.status(500).json({ 'err': 'Something went wrong', get: false });
        }

    }

    // Delete controller;
    static async remove(req, res) {
        const { ids } = req.body;

        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({ err: "No valid IDs provided", remove: false });
        }

        try {

            const removeParty = await salesInvoiceModel.updateMany(
                { _id: { $in: ids } },
                { $set: { isDel: true } }
            );

            if (removeParty.matchedCount === 0) {
                return res.status(404).json({ err: "No matching parties found", remove: false });
            }

            return res.status(200).json({
                msg: "Invoice deleted successfully",
                modifiedCount: removeParty.modifiedCount,
            });

        } catch (error) {
            return res.status(500).json({ err: "Something went wrong", remove: false });
        }
    };

    static async filter(req, res) {
        const {
            token, productName, fromDate, toDate, billNo, party, gst, billDate
        } = req.body;
        const { page, limit } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);


        if (!token) {
            return res.status(500).json({ 'err': 'Invalid user', get: false });
        }

        const getInfo = await getId(token);
        const getUser = await userModel.findOne({ _id: getInfo._id });

        const query = { companyId: getUser.activeCompany };
        if (productName) {
            query["items.itemName"] = productName
        }
        if (billNo) {
            query['salesInvoiceNumber'] = billNo
        }
        if (billDate) {
            query['invoiceDate'] = billDate;
        }


        if (fromDate && toDate) {
            console.log(`fromDate ${fromDate}\ntoDate ${toDate}`)
            query["invoiceDate"] = {
                $gte: new Date(fromDate),
                $lte: new Date(toDate)
            }
        } else if (fromDate) {
            query["invoiceDate"] = {
                $gte: new Date(fromDate)
            }
        } else if (toDate) {
            query["invoiceDate"] = {
                $lte: new Date(toDate)
            }
        }

        let totalData = await salesInvoiceModel.find({ ...query, isDel: false }).countDocuments();
        let allData = await salesInvoiceModel.find({ ...query, isDel: false }).skip(skip).limit(limit).sort({ _id: -1 }).populate('party');


        if (party && gst) {
            allData = allData.filter((d, i) => d.party.name === party && d.party.gst === gst);
        }
        else if (party) {
            allData = allData.filter((d, i) => d.party.name === party);
        }
        else if (gst) {
            allData = allData.filter((d, i) => d.party.gst === gst);
        }


        if (!allData) {
            return res.status(500).json({ 'err': 'No proforma availble', get: false });
        }

        return res.status(200).json({ data: allData, totalData: totalData });

    }

    /**
     * Get Total Collect.
     * Used Module: [Dashboard]
     */
    static async getTotalCollect(req, res) {
        const { token } = req.body;

        if (!token) {
            return res.status(500).json({ 'err': 'Invalid user' });
        }

        try {
            const getInfo = await getId(token);
            if (!getInfo) {
                return res.status(401).json({ err: 'invalid token' });
            }

            const getUser = await userModel.findOne({ _id: getInfo._id });

            const data = await salesInvoiceModel.aggregate([
                {
                    $match: {
                        userId: new mongoose.Types.ObjectId(String(getInfo._id)),
                        companyId: new mongoose.Types.ObjectId(getUser.activeCompany),
                        isDel: false,
                    }
                },
                {
                    $group: {
                        _id: null,
                        totalAmount: {
                            $sum: {
                                $subtract: [
                                    { $toDouble: "$finalAmount" },
                                    { $ifNull: [{ $toDouble: "$paymentAmount" }, 0] }
                                ]
                            }
                        }
                    }
                }
            ]);

            console.log(data);

            return res.status(200).json(data);

        } catch (error) {
            console.log(error)
            return res.status(500).json({ err: "Something went wrong" });
        }
    }

    static async getTotalSaleAmount(req, res) {
        const { token } = req.body;

        if (!token) {
            return res.status(500).json({ 'err': 'Invalid user' });
        }

        try {
            const getInfo = await getId(token);
            if (!getInfo) {
                return res.status(401).json({ err: 'invalid token' });
            }
            const getUser = await userModel.findOne({ _id: getInfo._id });

            const data = await salesInvoiceModel.aggregate([
                {
                    $match: {
                        userId: new mongoose.Types.ObjectId(String(getInfo._id)),
                        companyId: new mongoose.Types.ObjectId(getUser.activeCompany),
                        isDel: false
                    }
                },
                {
                    $group: {
                        _id: null,
                        totalAmount: { $sum: { $toDouble: "$finalAmount" } },
                    }
                }
            ]);


            return res.status(200).json(data);

        } catch (error) {
            console.log(error)
            return res.status(500).json({ err: "Something went wrong" });
        }

    }

    static async cancelInvoice(req, res) {
        const { token, id } = req.body;

        if (!token || !id) {
            return res.status(400).json({ err: "fill the required fields" });
        }

        const getInfo = await getId(token);
        const getUser = await userModel.findOne({ _id: getInfo._id });
        if (!getUser) {
            return res.status(500).json({ err: "Invalid user" });
        }

        try {
            // ✅ Already cancelled check
            const invoice = await salesInvoiceModel.findOne({ _id: id, companyId: getUser.activeCompany });
            if (!invoice) {
                return res.status(404).json({ err: "Invoice not found" });
            }
            if (invoice.isCancel) {
                return res.status(400).json({ err: "Invoice already cancelled" });
            }

            // |========================================|
            // |=======[RESTORE PURCHASE QTY]===========|
            // |========================================|
            const oldSettlements = await itemSettlementModel.find({
                salesBillId: id,
                userId: getUser._id,
                companyId: getUser.activeCompany
            });

            for (const settlement of oldSettlements) {
                for (const s of settlement.settlement) {
                    const purchaseInvoice = await purchaseInvoiceModel.findOne({
                        _id: s.purchaseBillId,
                        userId: new mongoose.Types.ObjectId(String(getUser._id)),
                        companyId: new mongoose.Types.ObjectId(String(getUser.activeCompany)),
                    });

                    if (!purchaseInvoice) continue;

                    const purchaseItem = purchaseInvoice.items.find(
                        p => String(p.itemId) === String(settlement.itemId)
                    );

                    if (!purchaseItem) continue;

                    const restored = Number(purchaseItem.remainingQun) + Number(s.settleQun);

                    await purchaseInvoiceModel.updateOne(
                        {
                            _id: s.purchaseBillId,
                            userId: new mongoose.Types.ObjectId(String(getUser._id)),
                            companyId: new mongoose.Types.ObjectId(String(getUser.activeCompany)),
                            "items.itemId": String(settlement.itemId)
                        },
                        {
                            $set: { "items.$.remainingQun": String(restored) }
                        }
                    );
                }
            }

            // ✅ Settlement records delete
            await itemSettlementModel.deleteMany({
                salesBillId: id,
                userId: getUser._id,
                companyId: getUser.activeCompany
            });

            // ✅ Invoice cancel mark
            const cancel = await salesInvoiceModel.updateOne(
                { _id: id, companyId: getUser.activeCompany },
                { $set: { isCancel: true } }
            );

            if (cancel.modifiedCount === 0) {
                return res.status(500).json({ err: "Invoice not cancelled" });
            }

            return res.status(200).json({ msg: "Invoice cancelled successfully" });

        } catch (err) {
            console.log(err);
            return res.status(500).json({ err: "Something went wrong" });
        }
    }
}

module.exports = SalesController