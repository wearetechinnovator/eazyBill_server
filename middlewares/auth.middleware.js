const jwt = require("jsonwebtoken");


const authMiddleware = async (req, res, next) => {
    try {
        const METHOD = req.method;
        let TOKEN;

        // Check GET or POST method;
        if (METHOD === "GET") {
            TOKEN = req.headers['x-token'];
        } else {
            TOKEN = req.body.token;
        }

        if (!TOKEN) {
            return res.status(500).json({ err: 'Unauthorized users' })
        }


        // Check token is valid or not;
        const decoded = jwt.verify(TOKEN, process.env.JWT_SECRET);
        if (!decoded) {
            return res.status(401).json({ err: 'Unauthorized users' })
        }

        req.data = decoded;
        next();
    } catch (error) {
        return res.status(401).json({ err: 'Unauthorized users' })
    }

}

module.exports = authMiddleware;