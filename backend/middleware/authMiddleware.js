const asyncHandler = require("express-async-handler")
const User = require("../models/userModel")
const jwt = require("jsonwebtoken")

const protect = asyncHandler( async (req, res, next) => {
    try {
        const token = req.cookies.token

        if(!token) {
            res.status(401)
            throw new Error("not authorized")
        }

        //verify token
        const verifed = jwt.verify(token, process.env.JWT_SECRET)

        //get user id from token
        const user = await User.findById(verifed.id).select("-password")

        if (!user) {
            res.status(400)
            throw new Error("user not found")
        }

        req.user = user
        next()

    } catch (error) {
        res.status(400)
        throw new Error("generic error in protect middleware")
    }

})

module.exports = protect