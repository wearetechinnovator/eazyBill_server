const { default: mongoose } = require('mongoose');
const itemModel = require('../modules/Item/item.model')

// CONVERT:
const convertUnitToBase = async ({ itemId, qun, selectedUnit }) => {
    const item = await itemModel.findOne({ _id: new mongoose.Types.ObjectId(String(itemId)) })
    if (!item) return null;

    const units = item.unit;

    const index = units.findIndex(u => u.unit === selectedUnit);
    if (index === -1) return null;

    let factor = 1;

    for (let i = index + 1; i < units.length; i++) {
        factor *= Number(units[i].conversion);
    }

    const baseQty = qun * factor;

    return {
        quantity: baseQty,
        unit: units[units.length - 1].unit
    };
}

// REVERSE:
function displayQty({ remainingQtyBase, selectedUnit, baseUnit, unitList }) {
    const index = unitList.findIndex(u => u.unit === selectedUnit);
    if (index === -1) {
        return `${remainingQtyBase} ${baseUnit}`;
    }

    let factor = 1;

    for (let i = index + 1; i < unitList.length; i++) {
        factor *= Number(unitList[i].conversion);
    }

    const qty = remainingQtyBase / factor;
    const whole = Math.floor(qty);
    const rem = remainingQtyBase % factor;

    if (rem === 0) {
        return `${whole} ${selectedUnit}`;
    }

    return `${whole} ${selectedUnit} ${rem} ${baseUnit}`;
}


module.exports = {
    displayQty,
    convertUnitToBase
}