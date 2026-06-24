const { getId } = require('../../helper/getIdFromToken');
const taxModel = require("./tax.model");
const userModel = require('../User/user.model');


class TaxController {
    static async add(req, res) {
        const { token, title, details, gst, cess, update, id } = req.body;

        if (!token || !title || !gst || !cess) {
            return res.status(500).json({ err: 'require fields are empty' });
        }


        try {
            const getInfo = await getId(token);
            const getUserData = await userModel.findOne({ _id: getInfo._id });

            const isExist = await taxModel.findOne({ title, companyId: getUserData.activeCompany, isDel: false });
            if (isExist && !update) {
                return res.status(500).json({ err: 'Tax alredy exist', create: false })
            }

            // update code.....
            if (update && id) {
                const update = await taxModel.updateOne({ _id: id }, {
                    $set: {
                        title, details, gst, cess
                    }
                })

                if (!update) {
                    return res.status(500).json({ err: 'Tax update failed', update: false })
                }

                return res.status(200).json(update)

            } // Update close here;

            const insert = await taxModel.create({
                userId: getUserData._id, companyId: getUserData.activeCompany,
                title, details, gst, cess
            });

            if (!insert) {
                return res.status(500).json({ err: 'Tax creation failed', create: false })
            }

            return res.status(200).json(insert);

        } catch (error) {
            return res.status(500).json({ 'err': 'Something went wrong', create: false });
        }

    }

    // get Controller
    static async get(req, res) {
        const { token, id, all, searchText } = req.body;
        const { page, limit } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);

        if (!token) {
            return res.status(500).json({ 'err': 'Invalid user', get: false });
        }

        try {
            const getInfo = await getId(token);
            const getUser = await userModel.findOne({ _id: getInfo._id });
            const totalData = await taxModel.countDocuments({
                companyId: getUser.activeCompany,
                isDel: false
            });

            let getData;
            let filter = {};
            if (searchText) {
                filter.title = { $regex: searchText.trim(), $options: "i" }
            }


            if (id) {
                getData = await taxModel.findOne({
                    companyId: getUser.activeCompany,
                    _id: id,
                    isDel: false
                })
            }
            else if (all) {
                getData = await taxModel.find({
                    companyId: getUser.activeCompany,
                    isDel: false
                }).skip(skip).limit(limit).sort({ _id: -1 });
            }
            else {
                getData = await taxModel.find({
                    companyId: getUser.activeCompany,
                    isDel: false,
                    ...filter
                }).skip(skip).limit(limit).sort({ _id: -1 });
            }

            if (!getData) {
                return res.status(500).json({ 'err': 'No tax availble', get: false });
            }

            return res.status(200).json({ data: getData, totalData: totalData });

        } catch (error) {
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
            const removeData = await taxModel.updateMany({ _id: { $in: ids } }, {
                $set: {
                    isDel: true
                }
            });

            if (removeData.matchedCount === 0) {
                return res.status(404).json({ err: "No matching tax found", remove: false });
            }

            return res.status(200).json({
                msg: "Tax successfully delete",
                modifiedCount: removeData.modifiedCount,
            });

        } catch (error) {
            console.log(error)
            return res.status(500).json({ err: "Something went wrong", remove: false });
        }

    }

}

module.exports = TaxController