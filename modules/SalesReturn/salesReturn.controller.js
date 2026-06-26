const { default: mongoose } = require('mongoose');
const { getId } = require('../../helper/getIdFromToken');
const Log = require("../../helper/insertLog");
const salesReturnModel = require('./salesReturn.model');
const userModel = require('../User/user.model');
const itemModel = require('../Item/item.model');
const companyModel = require('../Company/company.model');
const { updateLadger, addLadger } = require('../Ladger/ladger.controller');
const partyModel = require('../Party/party.model');
const itemSettlementModel = require("../Item/itemSattlement.model");
const purchaseInvoiceModel = require("../Purchase/purchase.model");


class SalesReturnController {
    static restorePurchaseItemOnReturn = async ({ items, userId, companyId, salesInvoiceId, salesReturnBillId }) => {
        try {
            // Original sale settlements — returnBillId null matlab sale record
            const originalSettlements = await itemSettlementModel.find({
                salesBillId: new mongoose.Types.ObjectId(String(salesInvoiceId)),
                returnBillId: null,
                userId,
                companyId
            });

            if (!originalSettlements.length) {
                return { status: false, message: "No settlements found for this sales invoice" };
            }

            // Is sale ke existing return settlements — kitna already return ho chuka
            const existingReturns = await itemSettlementModel.find({
                salesBillId: new mongoose.Types.ObjectId(String(salesInvoiceId)),
                returnBillId: { $ne: null },
                userId,
                companyId
            });

            const returnSettlementMap = {};

            for (const item of items) {
                let returnQty = Number(item.qun);
                const itemIdStr = String(item.itemId);

                const itemSettlement = originalSettlements.find(
                    s => String(s.itemId) === itemIdStr
                );
                if (!itemSettlement) continue;

                // Per purchase bill kitna already return ho chuka
                const alreadyReturnedMap = {};
                for (const ret of existingReturns) {
                    if (String(ret.itemId) !== itemIdStr) continue;
                    for (const s of ret.settlement) {
                        const key = String(s.purchaseBillId);
                        alreadyReturnedMap[key] = (alreadyReturnedMap[key] || 0) + Number(s.settleQun);
                    }
                }

                // LIFO order
                const lifoSettlements = [...itemSettlement.settlement].reverse();
                const itemReturnSettlements = [];

                for (const s of lifoSettlements) {
                    if (returnQty <= 0) break;

                    const alreadyReturned = alreadyReturnedMap[String(s.purchaseBillId)] || 0;
                    const maxRestorable = Number(s.settleQun) - alreadyReturned;
                    if (maxRestorable <= 0) continue;

                    const purchaseInvoice = await purchaseInvoiceModel.findOne({
                        _id: s.purchaseBillId,
                        userId: new mongoose.Types.ObjectId(String(userId)),
                        companyId: new mongoose.Types.ObjectId(String(companyId)),
                    });
                    if (!purchaseInvoice) continue;

                    const purchaseItem = purchaseInvoice.items.find(
                        p => String(p.itemId) === itemIdStr
                    );
                    if (!purchaseItem) continue;

                    const restoreQty = Math.min(returnQty, maxRestorable);
                    const newRemaining = Number(purchaseItem.remainingQun) + restoreQty;

                    const updateResult = await purchaseInvoiceModel.updateOne(
                        {
                            _id: s.purchaseBillId,
                            userId: new mongoose.Types.ObjectId(String(userId)),
                            companyId: new mongoose.Types.ObjectId(String(companyId)),
                            "items.itemId": itemIdStr
                        },
                        { $set: { "items.$.remainingQun": String(newRemaining) } }
                    );

                    if (updateResult.modifiedCount !== 1) {
                        return { status: false, message: `Failed to restore stock for ${item.itemName}` };
                    }

                    itemReturnSettlements.push({
                        purchaseBillId: s.purchaseBillId,
                        settleQun: restoreQty,
                        unit: item.selectedUnit
                    });

                    returnQty -= restoreQty;
                }

                returnSettlementMap[itemIdStr] = itemReturnSettlements;
            }

            // salesBillId = original sale id, returnBillId = return bill id
            await itemSettlementModel.insertMany(
                items.map(i => ({
                    userId,
                    companyId,
                    itemId: i.itemId,
                    salesBillId: new mongoose.Types.ObjectId(String(salesInvoiceId)),
                    returnBillId: new mongoose.Types.ObjectId(String(salesReturnBillId)),
                    settlement: returnSettlementMap[String(i.itemId)] || [],
                }))
            );

            return { status: true, message: "Stock restored successfully" };

        } catch (error) {
            console.error(error);
            return { status: false, message: error.message || "Failed to restore stock on return" };
        }
    };

    // salesInvoiceId frontend se doge — update/delete dono me
    static reverseReturnSettlement = async ({ salesInvoiceId, salesReturnBillId, userId, companyId }) => {
        try {
            // salesBillId + returnBillId dono se exact records dhundo
            const returnSettlements = await itemSettlementModel.find({
                salesBillId: new mongoose.Types.ObjectId(String(salesInvoiceId)),
                returnBillId: new mongoose.Types.ObjectId(String(salesReturnBillId)),
                userId,
                companyId
            });

            if (!returnSettlements.length) {
                return { status: true, message: "No settlements to reverse" };
            }

            for (const settlement of returnSettlements) {
                for (const s of settlement.settlement) {
                    const purchaseInvoice = await purchaseInvoiceModel.findOne({
                        _id: s.purchaseBillId,
                        userId: new mongoose.Types.ObjectId(String(userId)),
                        companyId: new mongoose.Types.ObjectId(String(companyId)),
                    });
                    if (!purchaseInvoice) continue;

                    const purchaseItem = purchaseInvoice.items.find(
                        p => String(p.itemId) === String(settlement.itemId)
                    );
                    if (!purchaseItem) continue;

                    // Jo restore hua tha woh wapas deduct karo
                    const newRemaining = Number(purchaseItem.remainingQun) - Number(s.settleQun);

                    await purchaseInvoiceModel.updateOne(
                        {
                            _id: s.purchaseBillId,
                            userId: new mongoose.Types.ObjectId(String(userId)),
                            companyId: new mongoose.Types.ObjectId(String(companyId)),
                            "items.itemId": String(settlement.itemId)
                        },
                        { $set: { "items.$.remainingQun": String(newRemaining) } }
                    );
                }

                // Record delete karo
                await itemSettlementModel.deleteOne({ _id: settlement._id });
            }

            return { status: true, message: "Return settlement reversed successfully" };

        } catch (error) {
            console.error(error);
            return { status: false, message: error.message || "Failed to reverse return settlement" };
        }
    };


    // Create and Save a new Quotation;
    static async add(req, res) {
        const {
            token, party, salesReturnNumber, returnDate, items, discountType, discountAmount, discountPercentage,
            additionalCharge, note, terms, update, id, paymentStatus, paymentAccount, paymentType, paymentAmount, finalAmount,
            autoRoundOff, roundOffAmount, roundOffType, salesInvoice
        } = req.body;

        if ([token, party, salesReturnNumber, returnDate, items]
            .some(field => !field || field === '')) {
            return res.status(400).json({ err: 'fill the blank' });
        }

        try {
            const getInfo = await getId(token);
            const getUserData = await userModel.findOne({ _id: getInfo._id });

            const isExist = await salesReturnModel.findOne({
                userId: getInfo._id, companyId: getUserData.activeCompany, salesReturnNumber: salesReturnNumber,
                isDel: false
            });

            if (isExist && !update) {
                return res.status(500).json({ err: 'Invoice already exist' })
            }


            // update code.....
            if (update && id) {
                const update = await salesReturnModel.updateOne({ _id: id }, {
                    $set: {
                        party, salesReturnNumber, returnDate, items, discountType, discountAmount,
                        discountPercentage, paymentStatus, paymentAccount, paymentType, paymentAmount,
                        finalAmount, salesInvoice, additionalCharge, note, terms, autoRoundOff,
                        roundOffAmount, roundOffType
                    }
                })

                if (update.modifiedCount === 0) {
                    return res.status(500).json({ err: 'Invoice update failed', update: false })
                }


                // Step 1: Reverse old return settlements
                const reverseResult = await SalesReturnController.reverseReturnSettlement({
                    salesInvoiceId: salesInvoice,
                    salesReturnBillId: id,
                    userId: getUserData._id,
                    companyId: getUserData.activeCompany,
                });

                if (!reverseResult.status) {
                    return res.status(500).json({ err: reverseResult.message });
                }

                // Step 2: Fresh restore with new items
                const reRestoreResult = await SalesReturnController.restorePurchaseItemOnReturn({
                    items,
                    userId: getUserData._id,
                    companyId: getUserData.activeCompany,
                    salesInvoiceId: salesInvoice,
                    salesReturnBillId: id
                })

                if (!reRestoreResult.status) {
                    return res.status(500).json({ err: reRestoreResult.message });
                }

                await updateLadger({
                    partyId: party,
                    voucher: 'sales_return',
                    voucherId: id,
                    date: returnDate,
                    credit: (finalAmount - (paymentAmount || 0)).toFixed(2)
                })

                return res.status(200).json(update)

            } // Update close here;


            let company = await companyModel.findOne({ _id: getUserData.activeCompany });
            const getInvPrefix = parseInt(company.salesReturnCount) + 1;
            await companyModel.updateOne({ _id: getUserData.activeCompany }, {
                $set: {
                    salesReturnCount: getInvPrefix
                }
            })

            const insert = await salesReturnModel.create({
                userId: getUserData._id, companyId: getUserData.activeCompany, party, salesReturnNumber,
                returnDate, items, discountType, discountAmount, discountPercentage, additionalCharge,
                paymentStatus, paymentAccount, paymentType, paymentAmount, finalAmount, salesInvoice,
                note, terms, autoRoundOff, roundOffAmount, roundOffType
            });

            if (!insert) {
                return res.status(500).json({ err: 'Invoice creation failed' });
            }

            const restoreResult = await SalesReturnController.restorePurchaseItemOnReturn({
                items,
                userId: getUserData._id,
                companyId: getUserData.activeCompany,
                salesInvoiceId: salesInvoice,
                salesReturnBillId: insert._id
            });

            if (!restoreResult.status) {
                await salesReturnModel.deleteOne({ _id: insert._id });
                return res.status(500).json({ err: restoreResult.message });
            }

            await addLadger({
                token: token,
                partyId: party,
                voucher: 'sales_return',
                voucherId: insert._id,
                date: returnDate,
                credit: (finalAmount - (paymentAmount || 0)).toFixed(2)
            })

            return res.status(200).json(insert);
        } catch (err) {
            console.log(err);
            return res.status(500).json({ err: 'Something went wrong' });
        }

    };

    // Get Controller;
    static async get(req, res) {
        const { token, id, all,
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
            const totalData = await salesReturnModel.countDocuments({
                companyId: getUser.activeCompany,
                isDel: false
            });

            let getData;
            let filter = {};
            if (startDate && endDate) {
                filter.returnDate = {
                    $gte: new Date(startDate),
                    $lte: new Date(endDate)
                }
            }
            if (billNo) {
                filter.salesReturnNumber = billNo
            }
            if (partyName) {
                const parties = await partyModel.find({
                    name: new RegExp(`${partyName}`, "i")
                }).select("_id");

                const partyIds = parties.map(p => p._id);

                filter.party = { $in: partyIds };
            }

            if (id) {
                getData = await salesReturnModel.findOne({
                    companyId: getUser.activeCompany,
                    _id: id,
                    isDel: false
                }).populate("party");
            }
            else if (all) {
                getData = await salesReturnModel.find({
                    companyId: getUser.activeCompany,
                    isDel: false,
                    ...filter
                }).skip(skip).limit(limit).sort({ _id: -1 }).populate('party');
            }
            else {
                getData = await salesReturnModel.find({
                    companyId: getUser.activeCompany,
                    isDel: false,
                    ...filter
                }).skip(skip).limit(limit).sort({ _id: -1 }).populate('party');
            }

            if (!getData) {
                return res.status(500).json({ 'err': 'No Invoice availble', get: false });
            }

            return res.status(200).json({ data: getData, totalData: totalData });

        } catch (error) {
            console.log(error)
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
            // userId/companyId return record se lo
            for (const returnBillId of ids) {
                const returnInvoice = await salesReturnModel.findOne({ _id: returnBillId });
                if (!returnInvoice) continue;

                const reverseResult = await SalesReturnController.reverseReturnSettlement({
                    userId: returnInvoice.userId,
                    companyId: returnInvoice.companyId,
                    salesInvoiceId: returnInvoice.salesInvoice,
                    salesReturnBillId: returnBillId
                });

                if (!reverseResult.status) {
                    return res.status(500).json({ err: reverseResult.message, remove: false });
                }
            }

            const removeResult = await salesReturnModel.updateMany(
                { _id: { $in: ids } },
                { $set: { isDel: true } }
            );

            if (removeResult.matchedCount === 0) {
                return res.status(404).json({ err: "No matching invoices found", remove: false });
            }

            return res.status(200).json({
                msg: "Invoice deleted successfully",
                modifiedCount: removeResult.modifiedCount,
            });

        } catch (error) {
            console.error(error);
            return res.status(500).json({ err: "Something went wrong", remove: false });
        }
    };

}


module.exports = SalesReturnController