const tdsRateModel = require("../models/tdsRate.model");


const add = async (req, res) => {
    const { title, rate } = req.body;

    if (!title || !rate) {
        return res.status(500).json({ err: "required fileds are empty" });
    }

    try {
        const insert = await tdsRateModel.create({ title, rate });
        if (!insert)
            return res.status(500).json({ err: "not insert" });

        return res.status(200).json(insert);

    } catch (error) {
        return res.status(500).json({ err: "Something went wrong" });
    }
}


const get = async (req, res) => {
    const { token } = req.body;

    if (!token)
        return res.status(500).json({ err: "invalid token id" });


    try {
        const data = await tdsRateModel.find({});
        if(!data || data.length < 1)
            return res.status(500).json({err: "No Data found"})

        
        return res.status(200).json(data);

    } catch (error) {
        return res.status(500).json({ err: "Something went wrong" });
    }
}

module.exports = {
    add,
    get
}