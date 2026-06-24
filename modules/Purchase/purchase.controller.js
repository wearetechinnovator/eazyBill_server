const { default: mongoose } = require('mongoose');
const { getId } = require('../../helper/getIdFromToken');
const Log = require('../../helper/insertLog');
const purchaseInvoiceModel = require('./purchase.model');
const userModel = require('../User/user.model');
const paymentoutModel = require('../PaymentOut/paymentOut.model');
const { updateLadger, addLadger } = require('../Ladger/ladger.controller');
const partyModel = require('../Party/party.model');
const companyModel = require('../Company/company.model');



class PurchaseController {
    static async add(req, res) {
        const {
            token, party, purchaseInvoiceNumber, originalInvoiceNumber, invoiceDate, validDate, items, discountType,
            discountAmount, discountPercentage, additionalCharge, note, terms, update, id, finalAmount,
            paymentStatus, paymentType, paymentAccount, paymentAmount, autoRoundOff, roundOffAmount, roundOffType
        } = req.body;


        items.forEach((i, _) => {
            const batchId = `BATCH-${i.itemId}-${Date.now()}${Math.ceil(Math.random() * 100)}`;
            i.batchId = batchId; // add new key to each item
        });

        if ([token, party, purchaseInvoiceNumber, invoiceDate, items]
            .some(field => !field || field === '')) {
            return res.status(400).json({ err: 'fill the blank' });
        }

        try {
            const getInfo = await getId(token);
            const getUserData = await userModel.findOne({ _id: getInfo._id });

            const isExist = await purchaseInvoiceModel.findOne({
                userId: getInfo._id, companyId: getUserData.activeCompany,
                purchaseInvoiceNumber: purchaseInvoiceNumber, isDel: false
            });
            if (isExist && !update) {
                return res.status(500).json({ err: 'Invoice already exist' })
            }


            // update code.....
            if (update && id) {
                const update = await purchaseInvoiceModel.updateOne({ _id: id }, {
                    $set: {
                        party, purchaseInvoiceNumber, invoiceDate, validDate, items, originalInvoiceNumber,
                        discountType, discountAmount, discountPercentage, additionalCharge, note, terms,
                        paymentStatus, paymentAccount, paymentType, paymentAmount, finalAmount, autoRoundOff,
                        roundOffAmount, roundOffType
                    }
                })

                if (update.modifiedCount === 0) {
                    return res.status(500).json({ err: 'Invoice update failed', update: false })
                }

                await updateLadger({
                    partyId: party,
                    voucher: 'purchase',
                    voucherId: id,
                    date: invoiceDate,
                    credit: (finalAmount - (paymentAmount || 0)).toFixed(2)
                })

                return res.status(200).json(update)

            } // Update close here;

            let company = await companyModel.findOne({ _id: getUserData.activeCompany });
            const getInvPrefix = parseInt(company.purchaseInvoiceNextCount) + 1;
            await companyModel.updateOne({ _id: getUserData.activeCompany }, {
                $set: {
                    purchaseInvoiceNextCount: getInvPrefix
                }
            })

            const insert = await purchaseInvoiceModel.create({
                userId: getUserData._id, companyId: getUserData.activeCompany, party, purchaseInvoiceNumber,
                originalInvoiceNumber, invoiceDate, validDate, items, discountType, discountAmount, discountPercentage,
                additionalCharge, note, terms, paymentStatus, paymentAccount, paymentType, paymentAmount,
                finalAmount, autoRoundOff, roundOffAmount, roundOffType
            });

            if (!insert) {
                return res.status(500).json({ err: 'Invoice creation failed' });
            }

            await addLadger({
                token: token,
                partyId: party,
                voucher: 'purchase',
                voucherId: insert._id,
                date: invoiceDate,
                credit: (finalAmount - (paymentAmount || 0)).toFixed(2)
            })


            return res.status(200).json(insert);

        } catch (err) {
            console.log(err)
            return res.status(500).json({ err: 'Something went wrong' });
        }

    }

    // Get Controller;
    static async get(req, res) {
        const { token, id, all, invoice, party,
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
            const totalData = await purchaseInvoiceModel.countDocuments({
                companyId: getUser.activeCompany,
                isDel: false
            });

            let getData;
            let filter = {};
            if (startDate && endDate) {
                filter.invoiceDate = {
                    $gte: new Date(startDate),
                    $lte: new Date(endDate)
                }
            }
            if (billNo) {
                filter.purchaseInvoiceNumber = billNo
            }
            if (partyName) {
                const parties = await partyModel.find({
                    name: new RegExp(`${partyName}`, "i")
                }).select("_id");

                const partyIds = parties.map(p => p._id);

                filter.party = { $in: partyIds };
            }

            if (id) {
                getData = await purchaseInvoiceModel.findOne({
                    companyId: getUser.activeCompany,
                    _id: id,
                    isDel: false
                }).populate("party");
            }
            else if (all) {
                getData = await purchaseInvoiceModel.find({
                    companyId: getUser.activeCompany,
                    isDel: false,
                    ...filter
                }).skip(skip).limit(limit).sort({ _id: -1 }).populate('party');

            }
            else if (invoice) {
                getData = await purchaseInvoiceModel.find({
                    companyId: getUser.activeCompany,
                    party: party || null,
                    isDel: false,
                    $expr: { $ne: ["$finalAmount", "$paymentAmount"] }
                }).sort({ _id: -1 });
            }
            else {
                getData = await purchaseInvoiceModel.find({
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
        const { ids, trash } = req.body;

        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({ err: "No valid IDs provided", remove: false });
        }

        try {
            let updateQuery;
            if (trash) {
                updateQuery = { $set: { isTrash: true } };
            } else {
                updateQuery = { $set: { isDel: true } };
            }

            const removeParty = await purchaseInvoiceModel.updateMany(
                { _id: { $in: ids } },
                updateQuery
            );

            if (removeParty.matchedCount === 0) {
                return res.status(404).json({ err: "No matching parties found", remove: false });
            }

            return res.status(200).json({
                msg: trash
                    ? "Invoice added to trash successfully"
                    : "Invoice deleted successfully",
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
            query['purchaseInvoiceNumber'] = billNo
        }
        if (billDate) {
            query['invoiceDate'] = billDate;
        }


        if (fromDate && toDate) {
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

        let totalData = await purchaseInvoiceModel.find({ ...query, isDel: false }).countDocuments();
        let allData = await purchaseInvoiceModel.find({ ...query, isDel: false }).skip(skip).limit(limit).sort({ _id: -1 }).populate('party');


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
     * Used Module: [Dashboard]
     */
    static async getTotalPay(req, res) {
        const { token } = req.body;

        if (!token) {
            return res.status(500).json({ 'err': 'Invalid user' });
        }

        try {
            const getInfo = await getId(token);
            if (!getInfo) return res.status(401).json({ err: 'invalid token' });
            const getUser = await userModel.findOne({ _id: getInfo._id, isDel: false });

            const data = await purchaseInvoiceModel.aggregate([
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

            return res.status(200).json(data);

        } catch (error) {
            console.log(error)
            return res.status(500).json({ err: "Something went wrong" });
        }
    }

    /**
     * Used Module: [Dashboard]
     */
    static async getTotalPurchaseAmount(req, res) {
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

            const data = await purchaseInvoiceModel.aggregate([
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
            return res.status(500).json({ err: "Something went wrong" });
        }

    }

}

module.exports = PurchaseController;