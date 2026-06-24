const { getId } = require('../helper/getIdFromToken');
const salesReturnModel = require('../models/salesreturn.model');
const userModel = require('../models/user.model');
const itemModel = require('../models/item.model');
const companyModel = require('../models/company.model');
const Log = require("../helper/insertLog");
const { addLadger, updateLadger } = require('./ladger.controller');
const partyModel = require('../models/party.model');


// Create and Save a new Quotation;
const add = async (req, res) => {
	const {
		token, party, salesReturnNumber, returnDate, items, discountType, discountAmount, discountPercentage,
		additionalCharge, note, terms, update, id, paymentStatus, paymentAccount, paymentType, paymentAmount, finalAmount,
		autoRoundOff, roundOffAmount, roundOffType
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
					party, salesReturnNumber, returnDate, items, discountType, discountAmount, discountPercentage,
					paymentStatus, paymentAccount, paymentType, paymentAmount, finalAmount,
					additionalCharge, note, terms, autoRoundOff, roundOffAmount, roundOffType
				}
			})

			if (update.modifiedCount === 0) {
				return res.status(500).json({ err: 'Invoice update failed', update: false })
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
			paymentStatus, paymentAccount, paymentType, paymentAmount, finalAmount,
			note, terms, autoRoundOff, roundOffAmount, roundOffType
		});

		if (!insert) {
			return res.status(500).json({ err: 'Invoice creation failed' });
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
		return res.status(500).json({ err: 'Something went wrong' });
	}

};


// Get Controller;
const get = async (req, res) => {
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
const remove = async (req, res) => {
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

		const removeParty = await salesReturnModel.updateMany(
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


// Resoter from trash
const restore = async (req, res) => {
	const { ids } = req.body;

	if (ids.length === 0) {
		return res.status(500).json({ err: 'require fields are empty', restore: false });
	}

	try {
		const restoreData = await salesReturnModel.updateMany({ _id: { $in: ids } }, {
			$set: {
				isTrash: false
			}
		})

		if (restoreData.matchedCount === 0) {
			return res.status(404).json({ err: "No tax restore", restore: false });
		}

		return res.status(200).json({ msg: 'Restore successfully', restore: true })


	} catch (error) {
		return res.status(500).json({ err: "Something went wrong", restore: false });
	}
}




module.exports = {
	add, get,
	remove,
	restore,
}

