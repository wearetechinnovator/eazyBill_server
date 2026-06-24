const { getId } = require('../../helper/getIdFromToken');
const partyModel = require('../../models/party.model');
const userModel = require('../../models/user.model');


class PartyController {
    static addParty = async (req, res) => {
        const {userId, name, type, contactNumber, billingAddress, shippingAddress, email,
            pan, gst, openingBalance, details, dob, partyCategory,
            openingBalanceType, country, state, postalCode
        } = req.body;

        if ([name, type, contactNumber, billingAddress, country, state, userId,]
            .some((field) => !field || field === "")) {
            return res.json({ err: 'require fields are empty', create: false });
        }

        try {
            const getUserData = await userModel.findOne({ _id: userId });

            if (!getUserData) {
                return res.status(500).json({ err: 'User not found', create: false });
            }


            const isPartyExist = await partyModel.findOne({
                userId, companyId: getUserData.activeCompany, contactNumber, isDel: false
            });

            if (isPartyExist) {
                return res.status(500).json({ err: 'Party alredy exist', create: false, isDel: false })
            }

            const insert = await partyModel.create({
                userId, companyId: getUserData.activeCompany,
                name, type, contactNumber, billingAddress, email,
                pan, gst, openingBalance, openingBalanceType,
                details, partyCategory: partyCategory || null,
                shippingAddress, dob, country: country.toLowerCase(),
                state: state.toLowerCase(), postalCode
            });


            if (!insert) {
                return res.status(500).json({ err: 'Party creation failed', create: false })
            }

            return res.status(200).json({
                success: true,
                msg: 'Party created successfully',
                partyId: insert._id,
                name: insert.name,
                type: insert.type,
                contactNumber: insert.contactNumber,
            });

        } catch (error) {
            console.log(error);
            return res.status(500).json({ 'err': 'Something went wrong', create: false });
        }
    }

}


module.exports = PartyController;