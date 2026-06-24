const { getId } = require('../helper/getIdFromToken');
const creditNoteModel = require('../models/creditnote.model');
const userModel = require('../models/user.model');
const companyModel = require("../models/company.model");
const Log = require("../helper/insertLog");
const salesinvoiceModel = require('../models/salesinvoice.model');
const { addLadger, updateLadger } = require('./ladger.controller');
const partyModel = require('../models/party.model');



// Create and Save a new Quotation;
const add = async (req, res) => {
	const {
		token, party, creditNoteNumber, creditNoteDate, items, discountType, salesInvoice,
		discountAmount, discountPercentage, additionalCharge, note, terms, update, id, finalAmount,
		autoRoundOff, roundOffAmount, roundOffType
	} = req.body;

	if ([token, party, creditNoteNumber, creditNoteDate, items]
		.some(field => !field || field === '')) {
		return res.status(400).json({ err: 'fill the blank' });
	}

	try {
		const getInfo = await getId(token);
		const getUserData = await userModel.findOne({ _id: getInfo._id });

		const isExist = await creditNoteModel.findOne({
			userId: getInfo._id, companyId: getUserData.activeCompany, creditNoteNumber: creditNoteNumber,
			isDel: false
		});

		if (isExist && !update) {
			return res.status(500).json({ err: 'Invoice already exist' })
		}



		// update code.....
		if (update && id) {
			const update = await creditNoteModel.updateOne({ _id: id }, {
				$set: {
					party, creditNoteNumber, creditNoteDate, items, salesInvoice, discountType, discountAmount,
					discountPercentage, additionalCharge, note, terms, autoRoundOff, roundOffAmount, roundOffType,
					finalAmount
				}
			})

			if (!update) {
				return res.status(500).json({ err: 'Invoice update failed', update: false })
			}

			// await updateLadger({
			// 	partyId: party,
			// 	voucher: 'credit_note',
			// 	voucherId: id,
			// 	date: creditNoteDate,
			// 	credit: (finalAmount).toFixed(2)
			// })

			return res.status(200).json(update)

		} // Update close here;


		let company = await companyModel.findOne({ _id: getUserData.activeCompany });
		const getInvPrefix = parseInt(company.creditNoteCount) + 1;
		await companyModel.updateOne({ _id: getUserData.activeCompany }, {
			$set: {
				creditNoteCount: getInvPrefix
			}
		})

		const insert = await creditNoteModel.create({
			userId: getUserData._id, companyId: getUserData.activeCompany, party, creditNoteNumber,
			creditNoteDate, salesInvoice, items, discountType, discountAmount, discountPercentage,
			additionalCharge, note, terms, autoRoundOff, roundOffAmount, roundOffType, finalAmount
		});

		if (!insert) {
			return res.status(500).json({ err: 'Invoice creation failed' });
		}

		// await addLadger({
		// 	token: token,
		// 	partyId: party,
		// 	voucher: 'credit_note',
		// 	voucherId: insert._id,
		// 	date: creditNoteDate,
		// 	credit: (finalAmount).toFixed(2)
		// })

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
		const totalData = await creditNoteModel.countDocuments({
			companyId: getUser.activeCompany,
			isDel: false
		});

		let getData;
		let filter = {};
		if (startDate && endDate) {
			filter.creditNoteDate = {
				$gte: new Date(startDate),
				$lte: new Date(endDate)
			}
		}
		if (billNo) {
			filter.creditNoteNumber = billNo
		}
		if (partyName) {
			const parties = await partyModel.find({
				name: new RegExp(`${partyName}`, "i")
			}).select("_id");

			const partyIds = parties.map(p => p._id);

			filter.party = { $in: partyIds };
		}


		if (id) {
			getData = await creditNoteModel.findOne({
				companyId: getUser.activeCompany,
				_id: id,
				isDel: false
			}).populate("party");
		}
		else if (all) {
			getData = await creditNoteModel.find({
				companyId: getUser.activeCompany,
				isDel: false,
				...filter
			}).skip(skip).limit(limit).sort({ _id: -1 }).populate('party');
		}
		else {
			getData = await creditNoteModel.find({
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

		const removeParty = await creditNoteModel.updateMany(
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
		const restoreData = await creditNoteModel.updateMany({ _id: { $in: ids } }, {
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

const filter = async (req, res) => {
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
		query['creditNoteNumber'] = billNo
	}
	if (billDate) {
		query['creditNoteDate'] = billDate;
	}


	if (fromDate && toDate) {
		console.log(`fromDate ${fromDate} \n toDate ${toDate}`)
		query["creditNoteDate"] = {
			$gte: new Date(fromDate),
			$lte: new Date(toDate)
		}
	} else if (fromDate) {
		query["creditNoteDate"] = {
			$gte: new Date(fromDate)
		}
	} else if (toDate) {
		query["creditNoteDate"] = {
			$lte: new Date(toDate)
		}
	}

	let totalData = await creditNoteModel.find({ ...query, isDel: false }).countDocuments();
	let allData = await creditNoteModel.find({ ...query, isDel: false }).skip(skip).limit(limit).sort({ _id: -1 }).populate('party');


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

//Get Sales bill by party ID
const getSales = async (req, res) => {
	const { token, partyId } = req.body;

	if (!token || !partyId) {
		return res.status(500).json({ 'err': 'token and party id is requires' });
	}

	try {
		const getInfo = await getId(token);
		const getUser = await userModel.findOne({ _id: getInfo._id });


		const bill = await salesinvoiceModel.find({
			companyId: getUser.activeCompany,
			party: partyId,
			isDel: false
		});

		if (!bill || bill.length === 0) {
			return res.status(404).json({ err: 'No inoice generate for this party' })
		}

		return res.status(200).json({ data: bill });

	} catch (error) {
		console.log(error)
		return res.status(500).json({ 'err': 'Something went wrong' });
	}

}



module.exports = {
	add, get, remove, restore, filter,
	getSales
}

