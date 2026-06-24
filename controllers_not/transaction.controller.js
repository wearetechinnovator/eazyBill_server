const transactionModel = require("../models/transaction.model");
const { getId } = require("../helper/getIdFromToken");
const userModel = require("../models/user.model");
const { default: mongoose } = require("mongoose");


const add = async (req, res) => {
	const { token, update, id, transactionType, transactionNumber, transactionDate, paymentMode,
		account, amount, note, category
	} = req.body;


	if ([token, transactionType, transactionNumber, transactionDate, paymentMode, amount, category]
		.some((field) => field === "" || !field)) {
		return res.status(400).json({ msg: "fill the require fields" });
	}


	try {
		const getInfo = await getId(token);
		const getUserData = await userModel.findOne({ _id: getInfo._id });

		const isExist = await transactionModel.findOne({
			userId: getInfo._id, companyId: getUserData.activeCompany,
			transactionNumber, isDel: false
		});
		if (isExist && !update) {
			return res.status(500).json({ err: 'Transaction alredy exist', create: false })
		}

		// update code.....
		if (update && id) {
			const update = await transactionModel.updateOne({ _id: id }, {
				$set: {
					transactionType, transactionNumber, transactionDate, paymentMode,
					account, amount, note, category
				}
			})

			if (update.modifiedCount === 0) {
				return res.status(500).json({ err: 'Transaction update failed', update: false })
			}

			return res.status(200).json(update)

		} // Update close here;

		const insert = await transactionModel.create({
			userId: getUserData._id, companyId: getUserData.activeCompany,
			transactionType, transactionNumber, transactionDate, paymentMode,
			account, amount, note, category
		});

		if (!insert) {
			return res.status(500).json({ err: 'Trasaction creation failed', create: false })
		}

		return res.status(200).json(insert);

	} catch (error) {
		console.log(error)
		return res.status(500).json({ 'err': 'Something went wrong', create: false });
	}


}


// Get Controller;
const get = async (req, res) => {
	const {
		token, id, all,
		startDate, endDate, category,
		searchText,
	} = req.body;
	const { page, limit } = req.query;
	const skip = (parseInt(page) - 1) * parseInt(limit);

	if (!token) {
		return res.status(500).json({ 'err': 'Invalid user', get: false });
	}

	try {
		const getInfo = await getId(token);
		const getUser = await userModel.findOne({ _id: getInfo._id });
		const totalData = await transactionModel.countDocuments({
			companyId: getUser.activeCompany,
			isDel: false
		});

		let getData;
		let filter = {}
		if (startDate && endDate) {
			filter.transactionDate = {
				$gte: new Date(startDate),
				$lte: new Date(endDate)
			}
		}
		if (category) {
			filter.category = category;
		}
		if (searchText) {
			filter.transactionNumber = searchText
		}



		if (id) {
			getData = await transactionModel.findOne({
				companyId: getUser.activeCompany,
				_id: id,
				isDel: false
			});
		}
		else if (all) {
			getData = await transactionModel.find({
				companyId: getUser.activeCompany,
				isDel: false,
				...filter
			}).skip(skip).limit(limit).sort({ _id: -1 })
				.populate("account").populate("category");
		}
		else {
			getData = await transactionModel.find({
				companyId: getUser.activeCompany,
				isDel: false,
				...filter
			}).skip(skip).limit(limit).sort({ _id: -1 })
				.populate("account").populate("category");
		}

		if (!getData) {
			return res.status(500).json({ 'err': 'No Transaction availble', get: false });
		}

		return res.status(200).json({ data: getData, totalData: totalData });

	} catch (error) {
		console.log(error)
		return res.status(500).json({ 'err': 'Something went wrong', get: false });
	}

}

// Delete controller
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

		const removeParty = await transactionModel.updateMany(
			{ _id: { $in: ids } },
			updateQuery
		);

		if (removeParty.matchedCount === 0) {
			return res.status(404).json({ err: "No matching Transaction found", remove: false });
		}

		return res.status(200).json({
			msg: trash
				? "Transaction added to trash successfully"
				: "Transaction deleted successfully",
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
		const restoreData = await transactionModel.updateMany({ _id: { $in: ids } }, {
			$set: {
				isTrash: false
			}
		})

		if (restoreData.matchedCount === 0) {
			return res.status(404).json({ err: "No transaction restore", restore: false });
		}

		return res.status(200).json({ msg: 'Restore successfully', restore: true })


	} catch (error) {
		return res.status(500).json({ err: "Something went wrong", restore: false });
	}
}


// Get Total Income and Expense
const getTotalIncomeExpense = async (req, res) => {
	const { token } = req.body;

	if (!token) {
		return res.status(500).json({ 'err': 'Invalid user', get: false });
	}

	try {
		const getInfo = await getId(token);
		const getUser = await userModel.findOne({ _id: getInfo._id });
		if (!getUser.activeCompany) {
			return res.status(500).json({ err: "No Company found" })
		}

		const result = await transactionModel.aggregate([
			{
				$match: {
					userId: new mongoose.Types.ObjectId(String(getInfo._id)),
					companyId: new mongoose.Types.ObjectId(String(getUser.activeCompany)),
					isDel: false
				}
			},
			{
				$group: {
					_id: null,
					totalIncome: {
						$sum: {
							$cond: [{ $eq: ["$transactionType", "income"] }, "$amount", 0]
						}
					},
					totalExpense: {
						$sum: {
							$cond: [{ $eq: ["$transactionType", "expense"] }, "$amount", 0]
						}
					}
				}
			},
			{
				$project: {
					_id: 0,
					totalIncome: 1,
					totalExpense: 1
				}
			}
		]);

		if (!result || result.length === 0) {
			return res.status(200).json({ totalIncome: 0, totalExpense: 0 });
		}

		return res.status(200).json(result[0]);

	} catch (error) {
		console.log(error);
		return res.status(500).json({ err: "Something went wrong", get: false });
	}
}

module.exports = {
	add, get, remove, restore,
	getTotalIncomeExpense
}
