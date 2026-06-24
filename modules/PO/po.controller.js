const { getId } = require('../../helper/getIdFromToken');
const Log = require("../../helper/insertLog");
const poModel = require('./po.model');
const userModel = require('../User/user.model');
const companyModel = require("../Company/company.model");
const partyModel = require('../Party/party.model');


class PoController {
    // Create and Save a new Quotation;
    static async add(req, res) {
        const {
            token, party, poNumber, poDate, validDate, items, discountType, discountAmount,
            discountPercentage, additionalCharge, note, terms, update, id, finalAmount,
            autoRoundOff, roundOffAmount, roundOffType, deliveryTime
        } = req.body;

        if ([token, party, poNumber, poDate, items]
            .some(field => !field || field === '')) {
            return res.status(400).json({ err: 'fill the blank server' });
        }

        try {
            const getInfo = await getId(token);
            const getUserData = await userModel.findOne({ _id: getInfo._id });

            const isExist = await poModel.findOne({
                userId: getInfo._id, companyId: getUserData.activeCompany, poNumber: poNumber,
                isDel: false
            });
            if (isExist && !update) {
                return res.status(500).json({ err: 'PO already exist' })
            }

            // update code.....
            if (update && id) {
                const update = await poModel.updateOne({ _id: id }, {
                    $set: {
                        party, poNumber, poDate, validDate, items, discountType, discountAmount, discountPercentage,
                        additionalCharge, note, terms, autoRoundOff, roundOffAmount, roundOffType, deliveryTime
                    }
                })

                if (!update) {
                    return res.status(500).json({ err: 'PO update failed', update: false })
                }

                return res.status(200).json(update)

            } // Update close here;


            let company = await companyModel.findOne({ _id: getUserData.activeCompany });
            const getInvPrefix = parseInt(company.poNextCount) + 1;
            await companyModel.updateOne({ _id: getUserData.activeCompany }, {
                $set: {
                    poNextCount: getInvPrefix
                }
            })


            const insert = await poModel.create({
                userId: getUserData._id, companyId: getUserData.activeCompany, party, poNumber, poDate,
                validDate, items, discountType, discountAmount, discountPercentage, additionalCharge,
                note, terms, autoRoundOff, roundOffAmount, roundOffType, deliveryTime
            });

            if (!insert) {
                return res.status(500).json({ err: 'PO creation failed' });
            }

            // Insert party log
            // await Log.insertPartyLog(token, insert._id, party, "Purchase Order", finalAmount, 'purchaseorder');

            return res.status(200).json(insert);

        } catch (err) {
            console.log(err)
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
            const totalData = await poModel.countDocuments({
                companyId: getUser.activeCompany,
                isDel: false
            });

            let getData;
            let filter = {};
            if (startDate && endDate) {
                filter.poDate = {
                    $gte: new Date(startDate),
                    $lte: new Date(endDate)
                }
            }
            if (billNo) {
                filter.poNumber = billNo
            }
            if (partyName) {
                const parties = await partyModel.find({
                    name: new RegExp(`${partyName}`, "i")
                }).select("_id");

                const partyIds = parties.map(p => p._id);

                filter.party = { $in: partyIds };
            }

            if (id) {
                getData = await poModel.findOne({
                    companyId: getUser.activeCompany,
                    _id: id,
                    isDel: false
                }).populate("party");
            }
            else if (all) {
                getData = await poModel.find({
                    companyId: getUser.activeCompany,
                    isDel: false,
                    ...filter
                }).skip(skip).limit(limit).sort({ _id: -1 }).populate('party');
            }
            else {
                getData = await poModel.find({
                    companyId: getUser.activeCompany,
                    isDel: false,
                    ...filter
                }).skip(skip).limit(limit).sort({ _id: -1 }).populate('party');
            }

            if (!getData) {
                return res.status(500).json({ 'err': 'No PO availble', get: false });
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

            const removeParty = await poModel.updateMany(
                { _id: { $in: ids } },
                updateQuery
            );

            if (removeParty.matchedCount === 0) {
                return res.status(404).json({ err: "No matching parties found", remove: false });
            }

            return res.status(200).json({
                msg: trash
                    ? "PO added to trash successfully"
                    : "PO deleted successfully",
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
            query['poNumber'] = billNo
        }
        if (billDate) {
            query['poDate'] = billDate;
        }


        if (fromDate && toDate) {
            console.log(`fromDate ${fromDate} \n toDate ${toDate}`)
            query["poDate"] = {
                $gte: new Date(fromDate),
                $lte: new Date(toDate)
            }
        } else if (fromDate) {
            query["poDate"] = {
                $gte: new Date(fromDate)
            }
        } else if (toDate) {
            query["poDate"] = {
                $lte: new Date(toDate)
            }
        }

        let totalData = await poModel.find({ ...query, isDel: false }).countDocuments();
        let allData = await poModel.find({ ...query, isDel: false }).skip(skip).limit(limit).sort({ _id: -1 }).populate('party');


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
            return res.status(500).json({ 'err': 'No purchase order availble', get: false });
        }

        return res.status(200).json({ data: allData, totalData: totalData });

    }

}

module.exports = PoController