const asyncHandler = require("express-async-handler")
const User = require("../models/userModel")
const Token = require("../models/tokenModel")
const jwt = require("jsonwebtoken")
const bcrypt = require("bcryptjs")
const mongoose = require("mongoose")
const crypto = require("crypto")
const sendEmail = require("../utilities/sendEmail")
const Product = require("../models/productModel")
const { fileSizeFormatter } = require("../utilities/fileUpload")

const contactUs = asyncHandler(async (req, res) => {
    const {subject, message} = req.body
    const user = await User.findById(req.user._id)
    
    if (!user) {
        res.status(400)
        throw new Error("user not found")
    }

    //validation
    if(!subject || !message) {
        res.status(400)
        throw new Error("fill all fields")
    }

    const sendTo = process.env.EMAIL_USER
    const sentFrom = process.env.EMAIL_USER
    const replyTo = user.email


    try {
        await sendEmail(subject, message, sendTo, sentFrom, replyTo)
        res.status(200).json({sucess: true, message: "email sent"})
    } catch (error) {
        res.status(500)
        throw new Error("email not sent")
    }
})

module.exports = {contactUs}