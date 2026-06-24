const { default: mongoose } = require("mongoose");
const { getId } = require("../helper/getIdFromToken");
const ladgerModel = require("../models/ladger.model");
const userModel = require("../models/user.model");


// Voucher enum wise model pair;
const voucherModels = {
	'sales': 'salesinvoice',
	'sales_return': 'salesreturn',
	'credit_note': 'creditnote',
	'purchase': 'purchaseinvoice',
	'purchase_return': 'purchasereturn',
	'debit_note': 'debitnote',
	'pay_in': 'paymentin',
	'pay_out': 'paymentout'
}

// Add Update Controller not used for API calling;
// ==============================================
const addLadger = async ({ token, partyId, voucher, voucherId, credit, debit, date }) => {
	try {
		const getInfo = await getId(token);
		const getUserData = await userModel.findOne({ _id: getInfo._id });

		// insert ladger
		const insert = await ladgerModel.create({
			userId: getUserData._id, companyId: getUserData.activeCompany,
			partyId, voucher, credit, debit, date, voucherId: voucherId ? new mongoose.Types.ObjectId(String(voucherId)) : null,
			voucherModel: voucherModels[voucher]
		})

		if (!insert) {
			return false;
		}

		return true;

	} catch (error) {
		console.log('Cath error: ', error)
		return false;
	}
}


const updateLadger = async ({ partyId, voucher, voucherId, credit, debit, date }) => {
	try {
		const update =  await ladgerModel.updateOne(
			{
				voucherId,
				voucher,
				partyId
			},
			{
				$set: {
					partyId,
					voucher,
					credit,
					debit,
					date,
					voucherId: voucherId
						? new mongoose.Types.ObjectId(String(voucherId))
						: null,
					voucherModel: voucherModels[voucher]
				}
			}
		)

		if (update.modifiedCount === 0) {
			return false;
		}

		return true;

	} catch (error) {
		console.log('Cath Update error: ', error);
		return false;
	}
}


const get = async (req, res) => {
	const { token, partyId } = req.body;
	const { page, limit } = req.query;
	const skip = (parseInt(page) - 1) * parseInt(limit);

	if (!token || !partyId) {
		res.status(500).json({ err: "invalid user" })
	}

	try {
		const getInfo = await getId(token);
		const getUser = await userModel.findOne({ _id: getInfo._id });

		const totalData = await ladgerModel.countDocuments({
			partyId, companyId: getUser.activeCompany,
			userId: getInfo._id
		});


		const getLadger = await ladgerModel.find({
			partyId, companyId: getUser.activeCompany,
			userId: getInfo._id
		}).skip(skip).limit(limit).populate("voucherId");


		if (!getLadger) {
			return res.status(500).json({ err: "No Ladger Found" })
		}

		return res.status(200).json({ data: getLadger, totalData });

	} catch (error) {
		res.status(500).json({ err: "Something went wrong" });
	}
}


const getPartyBalance = async (req, res) => {
	const { token, partyId } = req.body;

	if (!token || !partyId) {
		return res.status(500).json({ err: "required are blank" })
	}

	try {
		const getInfo = await getId(token);
		const getUser = await userModel.findOne({ _id: getInfo._id });

		const data = await ladgerModel.aggregate([
			{
				$match: {
					partyId: new mongoose.Types.ObjectId(String(partyId)),
					companyId: getUser.activeCompany,
					userId: new mongoose.Types.ObjectId(String(getInfo._id))
				}
			},
			{
				$group: {
					_id: "$partyId",
					totalDebit: { $sum: "$debit" },
					totalCredit: { $sum: "$credit" }
				}
			},
			{
				$project: {
					partyId: "$_id",
					balance: { $subtract: ["$totalDebit", "$totalCredit"] }
				}
			}
		]);

		return res.status(200).json({ data })

	} catch (error) {
		console.log(error)
		return res.status(500).json({ err: "Something went wrong" });
	}
}


const getAllPartyBalance = async (req, res) => {
	const { token } = req.body;

	if (!token) {
		return res.status(400).json({
			err: "Required fields are blank"
		});
	}

	try {

		const getInfo = await getId(token);

		const getUser = await userModel.findById(getInfo._id).select("activeCompany");

		const data = await ladgerModel.aggregate([
			{
				$match: {
					companyId: getUser.activeCompany,
					userId: new mongoose.Types.ObjectId(
						String(getInfo._id)
					)
				}
			},

			{
				$group: {
					_id: "$partyId",

					totalDebit: {
						$sum: {
							$ifNull: ["$debit", 0]
						}
					},

					totalCredit: {
						$sum: {
							$ifNull: ["$credit", 0]
						}
					}
				}
			},

			{
				$project: {
					_id: 0,
					partyId: "$_id",
					totalDebit: 1,
					totalCredit: 1,
					balance: {
						$subtract: [
							"$totalDebit",
							"$totalCredit"
						]
					}
				}
			}
		]);

		return res.status(200).json({
			get: true,
			data
		});

	} catch (error) {
		return res.status(500).json({
			err: "Something went wrong"
		});
	}
};



module.exports = {
	addLadger,
	updateLadger,
	get,
	getPartyBalance,
	getAllPartyBalance
}