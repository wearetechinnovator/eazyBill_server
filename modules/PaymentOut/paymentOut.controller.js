const { default: mongoose } = require("mongoose");
const { getId } = require("../../helper/getIdFromToken");
const paymentOutModel = require("./paymentOut.model");
const purchaseInvoiceModel = require("../Purchase/purchase.model");
const userModel = require("../User/user.model");
const { addLadger, updateLadger } = require("../Ladger/ladger.controller");
const sattlementModel = require("../Sattlement/sattlement.model");
const ladgerModel = require("../Ladger/ladger.model");
const partyModel = require('../Party/party.model');



class PaymentOutController {

    static async add(req, res) {
        const { token, party, paymentOutNumber, paymentOutDate, checkedInv,
            paymentMode, account, amount, details, update, id, invoiceId, tdsRate
        } = req.body;

        if ([token, party, paymentOutNumber, paymentOutDate, paymentMode, amount]
            .some((field) => field === "")) {
            return res.status(400).json({ msg: "fill the required" });
        }


        try {
            const getInfo = await getId(token);
            const getUserData = await userModel.findOne({ _id: getInfo._id });

            const isExist = await paymentOutModel.findOne({
                userId: getInfo._id, companyId: getUserData.activeCompany, paymentOutNumber: paymentOutNumber,
                isDel: false
            });
            if (isExist && !update) {
                return res.status(500).json({ err: 'Payment alredy exist', create: false, isDel: false })
            }

            // update code.....
            if (update && id) {
                const getSattleInvoice = await paymentOutModel.findOne({ _id: id });
                const sattleInvoices = getSattleInvoice.sattleInvoice; // Previous sattle invoice;
                const currentCheckedInv = checkedInv; // Current Sattle Invoice;

                // Sei sob invoice j gula payment kora hoyechilo kintu edit korar somoy sei invoice gula
                // unchecked kora hoyeche;
                const uncheckdInv = sattleInvoices.filter(saInv =>
                    !currentCheckedInv.some(chInv => chInv._id === saInv._id)
                );

                const update = await paymentOutModel.updateOne({ _id: id }, {
                    $set: {
                        party, paymentOutNumber, paymentOutDate, paymentMode, account, amount, details,
                        sattleInvoice: checkedInv, tdsRate
                    }
                })

                // Update sales invoice for reduce amount-- for uncheck bill;
                for (let unInv of uncheckdInv) {
                    await purchaseInvoiceModel.updateOne(
                        { _id: new mongoose.Types.ObjectId(String(unInv._id)) },
                        {
                            $inc: {
                                paymentAmount: -Number(unInv.receiveAmount || 0)
                            }
                        }
                    );
                }

                // Apply in invoice amount;
                for (inv of checkedInv) {
                    await purchaseInvoiceModel.updateOne({ _id: inv._id }, {
                        $set: {
                            paymentAmount: Number(inv?.receiveAmount || 0) + Number(inv.paymentAmount || 0)
                        }
                    })
                }

                if (update.modifiedCount === 0) {
                    return res.status(500).json({ err: 'Payment update failed', update: false })
                }

                await updateLadger({
                    partyId: party,
                    voucher: 'pay_out',
                    voucherId: id,
                    date: paymentOutDate,
                    debit: Number(amount).toFixed(2)
                })

                return res.status(200).json(update)

            } // Update close here;


            for (inv of checkedInv) {
                await purchaseInvoiceModel.updateOne({ _id: inv._id }, {
                    $set: {
                        paymentAmount: Number(inv?.receiveAmount || 0) + Number(inv.paymentAmount || 0)
                    }
                })
            }


            const insert = await paymentOutModel.create({
                userId: getUserData._id, companyId: getUserData.activeCompany, invoiceId,
                party, paymentOutNumber, paymentOutDate, paymentMode, account, amount, details,
                sattleInvoice: checkedInv, tdsRate
            });

            if (!insert) {
                return res.status(500).json({ err: 'Payment creation failed', create: false })
            }

            await addLadger({
                token: token,
                partyId: party,
                voucher: 'pay_out',
                voucherId: insert._id,
                date: paymentOutNumber,
                debit: Number(amount).toFixed(2)
            })

            await sattlementModel.create({
                userId: getUserData._id,
                companyId: getUserData.activeCompany,
                type: 'pay_out',
                typeId: insert._id,
                amount: amount,
                sattleInvoice: checkedInv,
            });

            return res.status(200).json(insert);

        } catch (error) {
            return res.status(500).json({ 'err': 'Something went wrong', create: false });
        }

    }

    static async getPaymentNo(req, res) {
        const { token } = req.body;

        if (!token) {
            return res.json({ err: 'require fields are empty', create: false });
        }

        try {
            const getInfo = await getId(token);
            const getUserData = await userModel.findOne({ _id: getInfo._id });

            if (!getUserData) {
                return res.status(404).json({ err: "user not found" })
            }

            const count = await paymentOutModel.findOne({
                companyId: getUserData.activeCompany,
                isDel: false
            }).sort({ createdAt: -1 });

            return res.status(200).json({ count: Number(count?.paymentOutNumber ?? 0) + 1 });

        } catch (err) {
            return res.status(500).json({ 'err': 'Something went wrong' });
        }

    }

    // Get Controller;
    static async get(req, res) {
        const { token, trash, id, all, totalPayment,
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
            const totalData = await paymentOutModel.countDocuments({
                companyId: getUser.activeCompany,
                isDel: false
            });

            let getData;
            let filter = {};
            if (startDate && endDate) {
                filter.paymentOutDate = {
                    $gte: new Date(startDate),
                    $lte: new Date(endDate)
                }
            }
            if (billNo) {
                filter.paymentOutNumber = billNo
            }
            if (partyName) {
                const parties = await partyModel.find({
                    name: new RegExp(`${partyName}`, "i")
                }).select("_id");

                const partyIds = parties.map(p => p._id);

                filter.party = { $in: partyIds };
            }

            if (id) {
                getData = await paymentOutModel.findOne({
                    companyId: getUser.activeCompany,
                    _id: id,
                    isDel: false
                }).populate("party");
            }
            else if (all) {
                getData = await paymentOutModel.find({
                    companyId: getUser.activeCompany,
                    isDel: false,
                    ...filter
                }).skip(skip).limit(limit).sort({ _id: -1 }).populate("party");
            }
            else {
                if (totalPayment) {
                    data = await paymentOutModel.find({ isDel: false, companyId: getUser.activeCompany });
                    const total = data.reduce((acc, i) => {
                        acc += parseInt(i.amount);
                        return acc;
                    }, 0)

                    return res.status(200).json({ totalAmount: total });

                }


                getData = await paymentOutModel.find({
                    companyId: getUser.activeCompany,
                    isDel: false,
                    ...filter
                }).skip(skip).limit(limit).sort({ _id: -1 }).populate("party");
            }

            if (!getData) {
                return res.status(500).json({ 'err': 'No party availble', get: false });
            }

            return res.status(200).json({ data: getData, totalData: totalData });

        } catch (error) {
            console.log(error)
            return res.status(500).json({ 'err': 'Something went wrong', get: false });
        }

    }

    // Delete controller
    static async remove(req, res) {
        const { ids } = req.body;

        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({ err: "No valid IDs provided", remove: false });
        }

        try {
            for (let i of ids) {
                const getSattleInvoice = await paymentOutModel.findById(i);
                if (!getSattleInvoice) continue;

                const sattleInvoices = getSattleInvoice.sattleInvoice || [];

                for (let inv of sattleInvoices) {
                    await purchaseInvoiceModel.updateOne(
                        { _id: inv._id },
                        {
                            $inc: {
                                paymentAmount: -Number(inv.receiveAmount || 0)
                            }
                        }
                    );

                }

                await ladgerModel.deleteOne({ voucherId: i });
            }

            const removeParty = await paymentOutModel.updateMany(
                { _id: { $in: ids } },
                { $set: { isDel: true } }
            );

            if (removeParty.matchedCount === 0) {
                return res.status(404).json({ err: "No matching parties found", remove: false });
            }

            return res.status(200).json({ msg: "Payment Out deleted successfully" });

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
            query['paymentOutNumber'] = billNo
        }
        if (billDate) {
            query['paymentOutDate'] = billDate;
        }


        if (fromDate && toDate) {
            console.log(`fromDate ${fromDate}\ntoDate ${toDate}`)
            query["paymentOutDate"] = {
                $gte: new Date(fromDate),
                $lte: new Date(toDate)
            }
        } else if (fromDate) {
            query["paymentOutDate"] = {
                $gte: new Date(fromDate)
            }
        } else if (toDate) {
            query["paymentOutDate"] = {
                $lte: new Date(toDate)
            }
        }

        let totalData = await paymentOutModel.find({ ...query, isDel: false }).countDocuments();
        let allData = await paymentOutModel.find({ ...query, isDel: false }).skip(skip).limit(limit).sort({ _id: -1 }).populate('party');


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

    static async getMonthWisePaymentOut(req, res) {
        const { token } = req.body;

        if (!token) {
            return res.status(500).json({ 'err': 'Invalid user' });
        }

        try {
            const getInfo = await getId(token);
            const getUserData = await userModel.findOne({ _id: getInfo._id });

            const currentYear = new Date().getFullYear();

            const result = await paymentOutModel.aggregate([
                {
                    $match: {
                        isDel: false,
                        userId: new mongoose.Types.ObjectId(String(getInfo._id)),
                        companyId: new mongoose.Types.ObjectId(getUserData.activeCompany),
                        paymentOutDate: {
                            $gte: new Date(`${currentYear}-01-01T00:00:00.000Z`),
                            $lte: new Date(`${currentYear}-12-31T23:59:59.999Z`)
                        }
                    }
                },
                {
                    $group: {
                        _id: { month: { $month: "$paymentOutDate" } },
                        totalAmount: { $sum: { $toDouble: "$amount" } }
                    }
                },
                {
                    // Convert grouped format -> { month, totalAmount }
                    $project: {
                        _id: 0,
                        month: "$_id.month",
                        totalAmount: 1
                    }
                },
                {
                    // Create array [1..12]
                    $facet: {
                        data: [{ $sort: { month: 1 } }],
                        months: [
                            {
                                $project: {
                                    months: { $range: [1, 13] }  // 1 to 12
                                }
                            }
                        ]
                    }
                },
                {
                    // Merge all months with actual data
                    $project: {
                        months: { $arrayElemAt: ["$months.months", 0] },
                        data: 1
                    }
                },
                {
                    $project: {
                        final: {
                            $map: {
                                input: "$months",
                                as: "m",
                                in: {
                                    month: "$$m",
                                    totalAmount: {
                                        $let: {
                                            vars: {
                                                match: {
                                                    $arrayElemAt: [
                                                        {
                                                            $filter: {
                                                                input: "$data",
                                                                as: "d",
                                                                cond: { $eq: ["$$d.month", "$$m"] }
                                                            }
                                                        },
                                                        0
                                                    ]
                                                }
                                            },
                                            in: { $ifNull: ["$$match.totalAmount", 0] }
                                        }
                                    }
                                }
                            }
                        }
                    }
                },
                {
                    $unwind: "$final"
                },
                {
                    $replaceRoot: { newRoot: "$final" }
                },
                { $sort: { month: 1 } }
            ]);

            return res.json(result);

        } catch (err) {
            console.error(err);
            return res.status(500).json({ success: false, message: "Server error" });
        }
    };

    static async getCashOut(req, res) {
        const { token } = req.body;

        if (!token) {
            return res.status(500).json({ 'err': 'Invalid user' });
        }

        try {
            const getInfo = await getId(token);
            const getUserData = await userModel.findOne({ _id: getInfo._id });

            const cashIn = await paymentOutModel.aggregate([
                {
                    $match: {
                        isDel: false,
                        userId: new mongoose.Types.ObjectId(getInfo._id),
                        companyId: new mongoose.Types.ObjectId(getUserData.activeCompany),
                        paymentMode: 'cash'
                    }
                },
                {
                    $group: {
                        _id: null,
                        totalCashOut: { $sum: { $toDouble: "$amount" } }
                    }
                }
            ])

            res.status(200).json(cashIn)

        } catch (error) {
            return res.status(500).json({ err: "Something went wrong" });
        }
    }

}

module.exports = PaymentOutController;