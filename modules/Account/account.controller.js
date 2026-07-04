const { default: mongoose } = require("mongoose");
const accountModel = require("./account.model");
const userModel = require("../User/user.model");
const { getId } = require("../../helper/getIdFromToken");
const paymentOutModel = require("../PaymentOut/paymentOut.model");
const paymentInModel = require("../PaymentIn/paymentIn.model");
const transactionModel = require("../OtherTransaction/otherTransaction.model");


class AccountController {
    static async add(req, res) {
        const {
            token, accountName, accountHolderName, openingBalance, asOfDate, isBankDetails,
            accountNumber, ifscCode, branchName, upiId, update, id
        } = req.body;


        if (!isBankDetails && !accountName) {
            return res.status(500).json({
                err: "require fields are empty", create: false
            });

        }
        else if (isBankDetails) {
            if ([accountName, accountHolderName, accountNumber, ifscCode, branchName].some((field) => !field || field === "")) {
                return res.status(500).json({
                    err: "require fields are empty", create: false
                });
            }
        }


        try {
            const getInfo = await getId(token);
            const getUserData = await userModel.findOne({ _id: getInfo._id });


            const isExist = await accountModel.findOne({
                userId: getUserData._id, companyId: getUserData.activeCompany,
                accountName, isDel: false
            });

            if (isExist && !update) {
                return res.status(500).json({
                    err: "Account alredy exist", create: false,
                    isDel: false
                });
            }


            //====================[UPDATE CODE]====================
            if (update && id) {
                const update = await accountModel.updateOne({ _id: id }, {
                    $set: {
                        accountName, accountHolderName, openingBalance, asOfDate, isBankDetails,
                        accountNumber, ifscCode, branchName, upiId
                    }
                })

                if (update.modifiedCount === 0) {
                    return res.status(500).json({ err: 'Account update failed', update: false })
                }

                return res.status(200).json(update)

            } // Update close here;

            const insert = await accountModel.create({
                userId: getUserData._id, companyId: getUserData.activeCompany,
                accountName, accountHolderName, openingBalance, asOfDate, isBankDetails,
                accountNumber, ifscCode, branchName, upiId
            });

            if (!insert) {
                return res.status(500).json({ err: "Account creation failed", create: false });
            }

            return res.status(200).json(insert);

        } catch (error) {
            return res.status(500).json({ err: "Something went wrong", create: false });
        }

    }

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

            const totalData = await accountModel.countDocuments({
                companyId: getUser.activeCompany,
                isDel: false
            });

            let getData;
            let filter = {};
            if (searchText) {
                filter.accountName = { $regex: searchText.trim(), $options: "i" }
            }


            if (id) {
                getData = await accountModel.findOne({
                    companyId: getUser.activeCompany,
                    _id: id,
                    isDel: false
                })
            }
            else if (all) {
                getData = await accountModel.find({
                    companyId: getUser.activeCompany,
                    isDel: false
                })
            }
            else {
                getData = await accountModel.find({
                    companyId: getUser.activeCompany,
                    isDel: false,
                    ...filter
                }).skip(skip).limit(limit).sort({ _id: -1 })
            }

            if (!getData) {
                return res.status(500).json({ 'err': 'No Account availble', get: false });
            }

            return res.status(200).json({ data: getData, totalData: totalData });

        } catch (error) {
            return res.status(500).json({ 'err': 'Something went wrong', get: false });
        }
    }

    // Delete controller
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

            const removeData = await accountModel.updateMany(
                { _id: { $in: ids } },
                updateQuery
            );

            if (removeData.matchedCount === 0) {
                return res.status(404).json({ err: "No matching category found", remove: false });
            }

            return res.status(200).json({
                msg: trash
                    ? "Account successfully trash"
                    : "Account successfully delete",
                modifiedCount: removeData.modifiedCount,
            });

        } catch (error) {
            return res.status(500).json({ err: "Something went wrong", remove: false });
        }
    };

    // Resoter from trash
    static async restore(req, res) {
        const { ids } = req.body;

        if (ids.length === 0) {
            return res.status(500).json({ err: 'require fields are empty', restore: false });
        }

        try {
            const restoreData = await accountModel.updateMany({ _id: { $in: ids } }, {
                $set: {
                    isTrash: false
                }
            })

            if (restoreData.matchedCount === 0) {
                return res.status(404).json({ err: "No account restore", restore: false });
            }

            return res.status(200).json({ msg: 'Restore successfully', restore: true })


        } catch (error) {
            return res.status(500).json({ err: "Something went wrong", restore: false });
        }
    }

    // Get Balance;
    static async getBalance(req, res) {
        const { token } = req.body;

        if (!token) {
            return res.status(500).json({ err: 'Please provide token' });
        }

        try {
            const getInfo = await getId(token);
            const getUserData = await userModel.findOne({ _id: getInfo._id });
            if (!getUserData.activeCompany) {
                return res.status(500).json({ err: "No Company found" })
            }

            const allPaymentIn = await paymentInModel.aggregate([
                {
                    $match: {
                        userId: getUserData._id,
                        companyId: getUserData.activeCompany,
                    }
                },
                {
                    $group: {
                        _id: "$account",
                        totalPaymentIn: { $sum: "$amount" },
                        count: { $sum: 1 }
                    }
                },
                {
                    $project: {
                        _id: 0,
                        account: "$_id",
                        totalPaymentIn: 1,
                        count: 1
                    }
                }
            ]);

            const allPaymentOut = await paymentOutModel.aggregate([
                {
                    $match: {
                        userId: getUserData._id,
                        companyId: getUserData.activeCompany,
                    }
                },
                {
                    $group: {
                        _id: "$account",
                        totalPaymentOut: { $sum: "$amount" },
                        count: { $sum: 1 }
                    }
                },
                {
                    $project: {
                        _id: 0,
                        account: "$_id",
                        totalPaymentOut: 1,
                        count: 1
                    }
                }
            ]);

            const otherTransaction = await transactionModel.aggregate([
                {
                    $match: {
                        userId: new mongoose.Types.ObjectId(String(getUserData._id)),
                        companyId: new mongoose.Types.ObjectId(String(getUserData.activeCompany)),
                        isDel: false
                    }
                },
                {
                    $group: {
                        _id: {
                            $cond: [
                                {
                                    $or: [
                                        { $eq: ["$paymentMode", "cash"] },
                                        { $eq: ["$account", ""] }
                                    ]
                                },
                                "Cash",       // 👈 group as Cash
                                "$account"    // 👈 group by account id
                            ]
                        },
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
                        account: "$_id",
                        totalIncome: 1,
                        totalExpense: 1,
                        balance: { $subtract: ["$totalIncome", "$totalExpense"] }
                    }
                }
            ]);

            const allAccount = await accountModel.find({
                userId: getUserData._id,
                companyId: getUserData.activeCompany,
            })

            const balance = {};
            allAccount.forEach((acc, _) => {
                const payInBalance = allPaymentIn.find(pIn => pIn.account === String(acc._id));
                const payOutBalance = allPaymentOut.find(pOut => pOut.account === String(acc._id));
                const transactionBalance = otherTransaction.find(t => t.account === String(acc._id));
                const openingBalance = acc.openingBalance || 0;

                balance[String(acc._id)] = Number(payInBalance?.totalPaymentIn || 0) - Number(payOutBalance?.totalPaymentOut || 0) + Number(transactionBalance?.balance || 0) + openingBalance;
            })

            const cashIn = allPaymentIn.find(pIn => pIn.account === "");
            const cashOut = allPaymentOut.find(pIn => pIn.account === "");
            balance['cash'] = Number(cashIn?.totalPaymentIn || 0) - Number(cashOut?.totalPaymentOut || 0) + Number(otherTransaction.find(t => t.account === "Cash")?.balance || 0);

            res.status(200).json(balance);

        } catch (error) {
            return res.status(500).json({ err: "Something went wrong" });
        }
    }

}

module.exports = AccountController;