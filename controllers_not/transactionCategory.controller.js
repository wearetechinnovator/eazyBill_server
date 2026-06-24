const { getId } = require('../helper/getIdFromToken');
const transactionModel = require('../models/transaction.model');
const transactionCategoryModal = require('../models/transactionCategory.modal');
const userModel = require('../models/user.model');


const add = async (req, res) => {
    const { token, categoryName, update, id } = req.body;

    if (!token || !categoryName) {
        return res.status(500).json({ err: 'require fields are empty' });
    }


    try {
        const getInfo = await getId(token);
        const getUserData = await userModel.findOne({ _id: getInfo._id });

        const isExist = await transactionCategoryModal.findOne({ categoryName, companyId: getUserData.activeCompany, isDel: false });
        if (isExist && !update) {
            return res.status(500).json({ err: 'Transaction Category alredy exist', create: false })
        }

        // update code.....
        if (update && id) {
            const update = await transactionCategoryModal.updateOne({ _id: id }, {
                $set: { categoryName }
            })

            if (update.modifiedCount === 0) {
                return res.status(500).json({ err: 'Transaction Category update failed', update: false })
            }

            return res.status(200).json({msg: 'Transaction Category updated successfully', update: true});

        } // Update close here;

        const insert = await transactionCategoryModal.create({
            userId: getUserData._id, companyId: getUserData.activeCompany,
            categoryName
        });

        if (!insert) {
            return res.status(500).json({ err: 'Transaction Category creation failed', create: false })
        }

        return res.status(200).json(insert);

    } catch (error) {
        console.log(error)
        return res.status(500).json({ 'err': 'Something went wrong', create: false });
    }

}


const get = async (req, res) => {
    const { token, id, } = req.body;

    if (!token) {
        return res.status(500).json({ 'err': 'Invalid user', get: false });
    }

    try {
        const getInfo = await getId(token);
        const getUser = await userModel.findOne({ _id: getInfo._id });

        const totalData = await transactionCategoryModal.countDocuments({
            companyId: getUser.activeCompany,
            isDel: false
        });

        let getData;
        if (id) {
            getData = await transactionCategoryModal.findOne({
                companyId: getUser.activeCompany,
                _id: id,
                isDel: false
            })
        }

        getData = await transactionCategoryModal.find({
            userId: getUser._id, companyId: getUser.activeCompany, isDel: false
        })

        if (!getData) {
            return res.status(500).json({ 'err': 'No Transaction Category availble', get: false });
        }

        return res.status(200).json({ data: getData, totalData: totalData });

    } catch (error) {
        console.log(error)
        return res.status(500).json({ 'err': 'Something went wrong', get: false });
    }

}


const remove = async (req, res) => {
    const { id } = req.body;

    if (!id) {
        return res.status(400).json({ err: "No valid IDs provided" });
    }

    try {
        const categoryInTransaction = await transactionModel.find({category: id});
        if(categoryInTransaction.length > 0){
            return res.status(500).json({err: "This category is associated with existing transactions, so it can't be deleted."})
        }

        const removeData = await transactionCategoryModal.updateMany({ _id: id }, {
            $set: {
                isDel: true
            }
        });

        if (removeData.matchedCount === 0) {
            return res.status(404).json({ err: "No matching Transaction Category found", remove: false });
        }

        return res.status(200).json({ msg: "Transaction Category successfully deleted" });

    } catch (error) {
        console.log(error);
        return res.status(500).json({ err: "Something went wrong", remove: false });
    }

}


module.exports = {
    add,
    remove,
    get
}