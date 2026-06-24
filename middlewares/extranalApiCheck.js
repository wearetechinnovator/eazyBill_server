const extranalApiCheck = async (req, res, next) => {
    const API_KEY = req.headers.authorization ? req.headers.authorization.split(" ")[1] : null;
    const SYSTEM_API_KEY = process.env.API_KEY;

    if (!API_KEY) {
        return res.status(400).json({ err: 'API Key is required' });
    }

    if (API_KEY !== SYSTEM_API_KEY) {
        return res.status(401).json({ err: 'Invalid API Key' });
    }

    next();

};

module.exports = extranalApiCheck;