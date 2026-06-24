const staffModel = require("../models/staff.model");
const { getId } = require('../helper/getIdFromToken');
const userModel = require('../models/user.model');
const attendanceSettingModel = require("../models/attendanceSetting.model");



const add = async (req, res) => {
  const {
    token, staffName, mobileNumber, dob, joiningDate, salaryPayOutType,
    id, salary, salaryCycle, openingBalance, openingBalanceType, email,
    update

  } = req.body;

  if ([staffName, mobileNumber, salary].some((field) => field === "" || !field)) {
    return res.status(500).json({ err: 'required fields are empty' });
  }


  try {
    const getInfo = await getId(token);
    const getUserData = await userModel.findOne({ _id: getInfo._id });

    const isExist = await staffModel.findOne({
      mobileNumber, companyId: getUserData.activeCompany, isDel: false
    });
    if (isExist && !update) {
      return res.status(500).json({ err: 'Staff alredy exist', create: false })
    }

    // update code.....
    if (update && id) {
      const update = await staffModel.updateOne({ _id: id }, {
        $set: {
          staffName, mobileNumber, dob, joiningDate, salaryPayOutType,
          salary, salaryCycle, openingBalance, openingBalanceType, email
        }
      })

      if (!update || update.modifiedCount === 0) {
        return res.status(500).json({ err: 'Staff update failed', update: false })
      }

      return res.status(200).json(update)

    } // Update close here;

    const insert = await staffModel.create({
      userId: getUserData._id, companyId: getUserData.activeCompany,
      staffName, mobileNumber, dob, joiningDate, salaryPayOutType,
      salary, salaryCycle, openingBalance, openingBalanceType, email
    });

    if (!insert) {
      return res.status(500).json({ err: 'Staff creation failed', create: false })
    }

    return res.status(200).json(insert);

  } catch (error) {
    console.log(error);
    return res.status(500).json({ 'err': 'Something went wrong', create: false });
  }

}


// get Controller
const get = async (req, res) => {
  const { token, id, all, searchText } = req.body;
  const { page, limit } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  if (!token) {
    return res.status(500).json({ 'err': 'Invalid user', get: false });
  }

  try {
    const getInfo = await getId(token);
    const getUser = await userModel.findOne({ _id: getInfo._id });
    const totalData = await staffModel.countDocuments({
      companyId: getUser.activeCompany,
      isDel: false
    });

    let getData;
    let filter = {};
    if (searchText) {
      filter.$or = [
        { staffName: { $regex: searchText.trim(), $options: "i" } },
        { mobileNumber: { $regex: searchText.trim(), $options: "i" } }
      ];
    }


    if (id) {
      getData = await staffModel.findOne({
        companyId: getUser.activeCompany,
        _id: id,
        isDel: false
      })
    }
    else if (all) {
      getData = await staffModel.find({
        companyId: getUser.activeCompany,
        isDel: false
      }).skip(skip).limit(limit).sort({ _id: -1 });
    }
    else {
      getData = await staffModel.find({
        companyId: getUser.activeCompany,
        isDel: false,
        ...filter
      }).skip(skip).limit(limit).sort({ _id: -1 });
    }

    if (!getData) {
      return res.status(500).json({ 'err': 'No Staff availble', get: false });
    }

    return res.status(200).json({ data: getData, totalData: totalData });

  } catch (error) {
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
    const removeData = await staffModel.updateMany(
      { _id: { $in: ids } },
      { $set: { isDel: true } }
    );

    if (removeData.matchedCount === 0) {
      return res.status(404).json({ err: "No matching Staff found", remove: false });
    }

    return res.status(200).json({
      msg: "Staff successfully deleted",
      modifiedCount: removeData.modifiedCount,
    });

  } catch (error) {
    return res.status(500).json({ err: "Something went wrong", remove: false });
  }

}


const addAttendanceSetting = async (req, res) => {
  const {
    attendanceReminder, reminderTime, defaultPresent, workingHour,
    workingMinute, weeklyOffDays, token
  } = req.body;

  if (!token) {
    return res.status(500).json({ err: "Invalid token provided" });
  }

  try {
    const getInfo = await getId(token);
    const getUserData = await userModel.findOne({ _id: getInfo._id });

    const insert = await attendanceSettingModel.updateOne(
      {
        userId: getUserData._id, companyId: getUserData.activeCompany
      },
      {
        $set: {
          attendanceReminder, reminderTime, defaultPresent, workingHour,
          workingMinute, weeklyOffDays
        }
      },
      { upsert: true }
    );



    if (!insert || (insert.modifiedCount === 0 && insert.upsertedCount === 0)) {
      return res.status(500).json({ err: 'Setting not added', create: false })
    }

    return res.status(200).json(insert);

  } catch (error) {
    console.log("Error", error);
    return res.status(500).json({ 'err': 'Something went wrong', create: false });
  }

}


const getAttendanceSetting = async (req, res) => {
  const { token } = req.body;

  if (!token) {
    return res.status(500).json({ err: "Invalid token provided" })
  }

  try {
    const getInfo = await getId(token);
    const getUser = await userModel.findOne({ _id: getInfo._id });

    const getSettings = await attendanceSettingModel.findOne({
      companyId: getUser.activeCompany,
      userId: getUser._id
    });

    if (!getSettings) {
      return res.status(404).json({ err: "Setting not found" });
    }

    return res.status(200).json({ data: getSettings })

  } catch (error) {
    return res.status(500).json({ 'err': 'Something went wrong', get: false });
  }


}




module.exports = {
  add, get, remove,
  addAttendanceSetting,
  getAttendanceSetting,
}