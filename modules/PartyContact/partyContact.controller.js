const { default: mongoose } = require("mongoose");
const { getId } = require("../../helper/getIdFromToken");
const partyContactsModel = require("./partyContact.model");
const userModel = require("../User/user.model");


class PartyContactController {
    static async addPartyContact(req, res) {
        const { token, partyId, name, phone, email, designation } = req.body;

        if ([token, partyId, name, phone, email]
            .some((field) => !field || field === "")) {
            return res.json({ err: 'require fields are empty', create: false });
        }

        try {
            const getInfo = await getId(token);
            const getUserData = await userModel.findOne({ _id: getInfo._id });

            if (!getUserData) {
                return res.status(404).json({ err: "user not found" })
            }

            // check existance;
            const isExists = await partyContactsModel.findOne({
                phone, userId: getUserData._id, companyId: getUserData.activeCompany,
                partyId, isDel: false
            });
            if (isExists) {
                return res.status(500).json({ err: "This contact already exists" });
            }


            const insert = await partyContactsModel.create({
                userId: getUserData._id, companyId: getUserData.activeCompany,
                name, partyId, phone, email, designation
            })

            if (!insert) {
                return res.status(500).json({ err: "Contact insertion failed" });
            }

            return res.status(201).json({
                data: insert,
                msg: "Contact add successfully"
            })


        } catch (err) {
            console.log(error);
            return res.status(500).json({ 'err': 'Something went wrong', create: false });
        }

    }

    static async updatePartyContact(req, res) {
        const { token, id, name, partyId, phone, email, designation } = req.body;

        if ([token, partyId, name, phone, id, email]
            .some((field) => !field || field === "")) {
            return res.json({ err: 'require fields are empty', create: false });
        }

        try {
            const getInfo = await getId(token);
            const getUserData = await userModel.findOne({ _id: getInfo._id });

            if (!getUserData) {
                return res.status(404).json({ err: "user not found" })
            }


            // Check existance;
            const isExists = await partyContactsModel.findOne({
                companyId: getUserData.activeCompany,
                partyId,
                phone,
                _id: { $ne: new mongoose.Types.ObjectId(id) },
                isDel: false
            });

            if (isExists) {
                return res.status(409).json({ err: "This contact already exists" });
            }


            const update = await partyContactsModel.updateOne({ _id: id }, {
                $set: {
                    name, phone, email, designation
                }
            })

            if (update.modifiedCount === 0) {
                return res.status(500).json({ err: "Contact not update" });
            }

            return res.status(200).json({ msg: "Contact update successfully" })


        } catch (err) {
            console.log(err);
            return res.status(500).json({ 'err': 'Something went wrong', create: false });
        }
    }

    static async deletePartyContact(req, res) {
        const { token, id } = req.body;

        if ([token, id].some((field) => !field || field === "")) {
            return res.json({ err: 'require fields are empty', deleted: false });
        }

        try {
            const getInfo = await getId(token);
            const getUserData = await userModel.findOne({ _id: getInfo._id });

            if (!getUserData) {
                return res.status(404).json({ err: "user not found" });
            }

            const deleted = await partyContactsModel.updateOne({ _id: id }, {
                $set: {
                    isDel: true
                }
            })

            if (deleted.modifiedCount === 0) {
                return res.status(404).json({ err: "Contact not found or already deleted" });
            }

            return res.status(200).json({ msg: "Contact deleted successfully" });

        } catch (err) {
            console.log(err);
            return res.status(500).json({ err: 'Something went wrong', deleted: false });
        }
    }

    static async getSinglePartyContact(req, res) {
        const { token, id } = req.body;

        if ([token, id].some((field) => !field || field === "")) {
            return res.json({ err: 'require fields are empty' });
        }

        try {
            const getInfo = await getId(token);
            const getUserData = await userModel.findOne({ _id: getInfo._id });

            if (!getUserData) {
                return res.status(404).json({ err: "user not found" });
            }

            const contact = await partyContactsModel.findOne({
                _id: id,
                userId: getUserData._id,
                companyId: getUserData.activeCompany,
                isDel: false
            });

            if (!contact) {
                return res.status(404).json({ err: "Contact not found" });
            }

            return res.status(200).json({ data: contact });

        } catch (err) {
            console.log(err);
            return res.status(500).json({ err: 'Something went wrong' });
        }
    }

    static async getAllPartyContacts(req, res) {
        const { token, partyId } = req.body;

        if ([token, partyId].some((field) => !field || field === "")) {
            return res.json({ err: 'require fields are empty' });
        }

        try {
            const getInfo = await getId(token);
            const getUserData = await userModel.findOne({ _id: getInfo._id });

            if (!getUserData) {
                return res.status(404).json({ err: "user not found" });
            }

            const contacts = await partyContactsModel.find({
                partyId,
                userId: getUserData._id,
                companyId: getUserData.activeCompany,
                isDel: false
            }).sort({ _id: -1 });

            return res.status(200).json({ data: contacts });

        } catch (err) {
            console.log(err);
            return res.status(500).json({ err: 'Something went wrong' });
        }
    }
}

module.exports = PartyContactController;