const { getId } = require("../helper/getIdFromToken");
const paymentInModel = require("../models/paymentin.model");
const salesinvoiceModel = require("../models/salesinvoice.model");
const userModel = require("../models/user.model");
const Log = require('../helper/insertLog');
const { addLadger, updateLadger } = require("./ladger.controller");
const { default: mongoose } = require("mongoose");
const ladgerModel = require("../models/ladger.model");
const sattlementModel = require("../models/sattlement.model");
const partyModel = require('../models/party.model');




const add = async (req, res) => {
	const { token, party, paymentInNumber, paymentInDate, checkedInv,
		paymentMode, account, amount, details, update, id, invoiceId, tdsRate
	} = req.body;


	if ([token, party, paymentInNumber, paymentInDate, paymentMode, amount]
		.some((field) => field === "")) {
		return res.status(400).json({ msg: "fill the required" });
	}


	try {
		const getInfo = await getId(token);
		const getUserData = await userModel.findOne({ _id: getInfo._id });

		const isExist = await paymentInModel.findOne({
			userId: getInfo._id, companyId: getUserData.activeCompany, paymentInNumber: paymentInNumber,
			isDel: false
		});
		if (isExist && !update) {
			return res.status(500).json({ err: 'Payment alredy exist', create: false, isDel: false })
		}

		// Update code.....
		if (update && id) {
			// Get uncheck invoices;
			const getSattleInvoice = await paymentInModel.findOne({ _id: id });
			const sattleInvoices = getSattleInvoice.sattleInvoice; // Previous sattle invoice;
			const currentCheckedInv = checkedInv; // Current Sattle Invoice;

			// Sei sob invoice j gula payment kora hoyechilo kintu edit korar somoy sei invoice gula
			// unchecked kora hoyeche;
			const uncheckdInv = sattleInvoices.filter(saInv =>
				!currentCheckedInv.some(chInv => chInv._id === saInv._id)
			);

			const update = await paymentInModel.updateOne({ _id: id }, {
				$set: {
					party, paymentInNumber, paymentInDate, paymentMode, account, amount, details,
					sattleInvoice: checkedInv, tdsRate
				}
			})

			// Update sales invoice for reduce amount-- for uncheck bill;
			for (let unInv of uncheckdInv) {
				await salesinvoiceModel.updateOne(
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
				await salesinvoiceModel.updateOne({ _id: inv._id }, {
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
				voucher: 'pay_in',
				voucherId: id,
				date: paymentInDate,
				credit: Number(amount).toFixed(2)
			})

			return res.status(200).json(update)

		} // Update close here;


		for (inv of checkedInv) {
			await salesinvoiceModel.updateOne({ _id: inv._id }, {
				$set: {
					paymentAmount: Number(inv?.receiveAmount || 0) + Number(inv.paymentAmount || 0)
				}
			})
		}


		const insert = await paymentInModel.create({
			userId: getUserData._id, companyId: getUserData.activeCompany, invoiceId,
			party, paymentInNumber, paymentInDate, paymentMode, account, amount, details,
			sattleInvoice: checkedInv, tdsRate
		});


		if (!insert) {
			return res.status(500).json({ err: 'Payment creation failed', create: false })
		}

		await addLadger({
			token: token,
			partyId: party,
			voucher: 'pay_in',
			voucherId: insert._id,
			date: paymentInDate,
			credit: Number(amount).toFixed(2)
		})

		await sattlementModel.create({
			userId: getUserData._id,
			companyId: getUserData.activeCompany,
			type: 'pay_in',
			typeId: insert._id,
			amount: amount,
			sattleInvoice: checkedInv,
		});


		// Insert partylog;
		// await Log.insertPartyLog(token, insert._id, party, "Paymentin", amount, "", 'paymentin');

		return res.status(200).json(insert);
	} catch (error) {
		return res.status(500).json({ 'err': 'Something went wrong', create: false });
	}
}


// Get Controller;
const get = async (req, res) => {
	const { token, id, all, totalPayment,
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
		const totalData = await paymentInModel.countDocuments({
			companyId: getUser.activeCompany,
			isDel: false
		});

		let getData;
		let filter = {};
		if (startDate && endDate) {
			filter.paymentInDate = {
				$gte: new Date(startDate),
				$lte: new Date(endDate)
			}
		}
		if (billNo) {
			filter.paymentInNumber = billNo
		}
		if (partyName) {
			const parties = await partyModel.find({
				name: new RegExp(`${partyName}`, "i")
			}).select("_id");

			const partyIds = parties.map(p => p._id);

			filter.party = { $in: partyIds };
		}

		if (id) {
			getData = await paymentInModel.findOne({
				companyId: getUser.activeCompany,
				_id: id,
				isDel: false
			}).populate("party");
		}
		else if (all) {
			getData = await paymentInModel.find({
				companyId: getUser.activeCompany,
				isDel: false,
				...filter
			}).skip(skip).limit(limit).sort({ _id: -1 }).populate("party");;
		}
		else {
			if (totalPayment) {
				data = await paymentInModel.find({
					companyId: getUser.activeCompany,
					isDel: false,
				});

				const total = data.reduce((acc, i) => {
					acc += parseInt(i.amount);
					return acc;
				}, 0)

				return res.status(200).json({ totalAmount: total });

			}

			getData = await paymentInModel.find({
				companyId: getUser.activeCompany,
				isDel: false,
				...filter
			}).skip(skip).limit(limit).sort({ _id: -1 }).populate("party");

		}

		if (!getData) {
			return res.status(500).json({ 'err': 'No Paymentin availble', get: false });
		}

		return res.status(200).json({ data: getData, totalData: totalData });

	} catch (error) {
		console.log(error)
		return res.status(500).json({ 'err': 'Something went wrong', get: false });
	}

}


// Delete controller
const remove = async (req, res) => {
	const { ids } = req.body;

	if (!ids || !Array.isArray(ids) || ids.length === 0) {
		return res.status(400).json({ err: "No valid IDs provided", remove: false });
	}

	try {

		for (let i of ids) {
			const getSattleInvoice = await paymentInModel.findById(i);
			if (!getSattleInvoice) continue;

			const sattleInvoices = getSattleInvoice.sattleInvoice || [];

			for (let inv of sattleInvoices) {
				await salesinvoiceModel.updateOne(
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

		const removeParty = await paymentInModel.updateMany(
			{ _id: { $in: ids } },
			{ $set: { isDel: true } }
		);

		if (removeParty.matchedCount === 0) {
			return res.status(404).json({ err: "No matching parties found", remove: false });
		}


		return res.status(200).json({ msg: "Payment In deleted successfully" });

	} catch (error) {
		console.log(error);
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
		const restoreData = await paymentInModel.updateMany({ _id: { $in: ids } }, {
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
		query['paymentInNumber'] = billNo
	}
	if (billDate) {
		query['paymentInDate'] = billDate;
	}


	if (fromDate && toDate) {
		query["paymentInDate"] = {
			$gte: new Date(fromDate),
			$lte: new Date(toDate)
		}
	} else if (fromDate) {
		query["paymentInDate"] = {
			$gte: new Date(fromDate)
		}
	} else if (toDate) {
		query["paymentInDate"] = {
			$lte: new Date(toDate)
		}
	}


	let totalData = await paymentInModel.find({ ...query, isDel: false }).countDocuments();
	let allData = await paymentInModel.find({ ...query, isDel: false })
		.skip(skip).limit(limit).sort({ _id: -1 }).populate('party');


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
		return res.status(500).json({ 'err': 'No payment availble', get: false });
	}

	return res.status(200).json({ data: allData, totalData: totalData });

}


const getMonthWisePaymentIn = async (req, res) => {
	const { token } = req.body;

	if (!token) {
		return res.status(500).json({ 'err': 'Invalid user' });
	}

	try {
		const getInfo = await getId(token);
		const getUserData = await userModel.findOne({ _id: getInfo._id });

		const currentYear = new Date().getFullYear();

		const result = await paymentInModel.aggregate([
			{
				$match: {
					isDel: false,
					userId: new mongoose.Types.ObjectId(getInfo._id),
					companyId: new mongoose.Types.ObjectId(getUserData.activeCompany),
					paymentInDate: {
						$gte: new Date(`${currentYear}-01-01T00:00:00.000Z`),
						$lte: new Date(`${currentYear}-12-31T23:59:59.999Z`)
					}
				}
			},
			{
				$group: {
					_id: { month: { $month: "$paymentInDate" } },
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


const getCashIn = async (req, res) => {
	const { token } = req.body;

	if (!token) {
		return res.status(500).json({ 'err': 'Invalid user' });
	}

	try {
		const getInfo = await getId(token);
		const getUserData = await userModel.findOne({ _id: getInfo._id });

		const cashIn = await paymentInModel.aggregate([
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
					totalCashIn: { $sum: { $toDouble: "$amount" } }
				}
			}
		])

		res.status(200).json(cashIn)

	} catch (error) {
		return res.status(500).json({ err: "Something went wrong" });
	}
}


module.exports = {
	add, get, remove, restore, filter,
	getMonthWisePaymentIn,
	getCashIn
}
