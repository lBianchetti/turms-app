const asyncHandler = require("express-async-handler")
const User = require("../models/userModel")
const Token = require("../models/tokenModel")
const jwt = require("jsonwebtoken")
const bcrypt = require("bcryptjs")
const mongoose = require("mongoose")
const crypto = require("crypto")
const sendEmail = require("../utilities/sendEmail")


const generateToken = (id) => {
    return jwt.sign({id}, process.env.JWT_SECRET, {})
}

//register user
const registerUser = asyncHandler( async (req, res) => {
    const {name, email, password} = req.body

    //validation
    if(!name) {
        res.status(400)
        throw new Error("fill name")
    }

    if(!email) {
        res.status(400)
        throw new Error("fill email")
    }

    if(!password) {
        res.status(400)
        throw new Error("fill password")
    }

    //unique email
    const userExists = await User.findOne({email})
    if(userExists){
        res.status(400)
        throw new Error("email already registred")
    }

    //create new user
    const user = await User.create({name, email, password})
    
    //Generate Token
    const token = generateToken(user._id)

    //Send HTTP cookie
    res.cookie("token", token, {path:"/", httpOnly: true, sameSite: "none", secure: "true"})

    if(user){
        res.status(201).json({
            _id: user.id,
            name: user.name,
            email: user.email,
            password: user.password,
            token,
            
        })
    } else {
        res.status(400)
        throw new Error("invalid user data")
    }
})

//login user
const loginUser = asyncHandler( async (req, res) => {
    const {email, password} = req.body

    //validate
    if(!email || !password){
        res.status(400)
        throw new Error("add email and password")
    }

    //check if user exists
    const user = await User.findOne({email})
    if(!user){
        res.status(400)
        throw new Error("user not found")
    }

    //check password
    const passwordIsCorrect = await bcrypt.compare(password, user.password)
    
        //Generate Token
        const token = generateToken(user._id)

        if(passwordIsCorrect){
            //Send HTTP cookie
            res.cookie("token", token, {path:"/", httpOnly: true, sameSite: "none", secure: "true"})
        } else {
            res.status(400)
            throw new Error("invalid password   ")
        }

        if(user){
            res.status(201).json({
                _id: user.id,
                name: user.name,
                email: user.email,
                password: user.password,
                token,
                
            })
        } else {
            res.status(400)
            throw new Error("invalid user data")
        }

    if(user && passwordIsCorrect) {
        res.status(200).json({
            _id: user.id,
            name: user.name,
            email: user.email,
            password: user.password,
            token
        })
    } else {
        res.status(400)
        throw new Error("invalid password or email")   
    }


})

//logout user
const logout = asyncHandler( async (req, res) => {
    res.cookie("token", "", {path:"/", httpOnly: true, expires: new Date(0), sameSite: "none", secure: "true"})
    return res.status(200).json({message: "successfuly loged out"})
})

//get user
const getUser = asyncHandler( async (req, res) => {
    const user = await User.findById(req.user._id)

    if(user){
        res.status(200).json({
            _id: user.id,
            name: user.name,
            email: user.email,
        })
    } else {
        res.status(400)
        throw new Error("user not found")
    }
})

//get login status
const loginStatus = asyncHandler( async (req, res) => {
    const token = req.cookies.token
    if(!token) {
        return res.json(false)
    }

    //verify token
    const verifed = jwt.verify(token, process.env.JWT_SECRET)

    if(verifed) {
        return res.json(true)
    } else {
        return res.json(false)
    }
})

//Update user 
const updateUser = asyncHandler( async (req, res) => {
    const user = await User.findById(req.user._id)

    if (user) {
        const {name, email} = user
        user.email = email
        user.name = req.body.name || name

        const updatedUser = await user.save()
        res.status(200).json({
            name: updatedUser.name,
            email: updatedUser.email
        })
    } else {
        res.status(404)
        throw new Error("user not found")
    }
})

const updatePassword = asyncHandler( async (req, res) => {
    const user = await User.findById(req.user._id)
    const {oldPassword, password} = req.body

    //validade
    if (!user) {
    res.status(400)
    throw new Error("user not found")
    }

    //validade fields
    if (!oldPassword || !password) {
        res.status(400)
        throw new Error("fill all passwords fields")
    }

    //validade old pass macht
    const passwordIsCorrect = await bcrypt.compare(oldPassword, user.password)

    //save new password
    if (user && passwordIsCorrect) {
        user.password = password
        await user.save()
        res.status(200).send("password changed successfully")
    } else {
        res.status(400)
        throw new Error("cannot change password")
    }
})

const forgotPassword = asyncHandler( async (req, res) => {
    const {email} = req.body
    const user = await User.findOne({email})

    if(!user) {
        res.status(404)
        throw new Error("user not found")
    }

    //delete old token
    let token = await Token.findOne({userId: user._id})
    if (token) {
        await token.deleteOne()
    }

    //Create reset token
    let resetToken = crypto.randomBytes(32).toString("hex") + user._id
    
    //hash token
    const hashedToken = crypto.createHash("sha256").update(resetToken).digest("hex")

    //save token to db
    await new Token({userId: user._id, token: hashedToken, createdAt: Date.now(), expiresAt: Date.now() + 30 * (60 * 1000)}).save()

    //reset url
    const resetUrl = `${process.env.FRONTEND_URL}/resetpassword/${resetToken}`

    const message = 
    `<h2>Hello, ${user.name}</h2>
    <p>use the link below to reset your password, the link is valid for 30 minutes</p>
    <br>
    <a href=${resetUrl} clicktraking=off>${resetUrl}</a>`

    const subject = "Password Reset"
    const sendTo = user.email
    const sentFrom = process.env.EMAIL_USER

    try {
        await sendEmail(subject, message, sendTo, sentFrom)
        res.status(200).json({sucess: true, message: "reset email sent"})
    } catch (error) {
        res.status(500)
        throw new Error("email not sent")
    }
})

const resetPassword = asyncHandler( async (req, res) => {
    const {password} = req.body
    const {resetToken} = req.params

    //hash token
    const hashedToken = crypto.createHash("sha256").update(resetToken).digest("hex")

    //find token in db
    const userToken = await Token.findOne({token: hashedToken, expiresAt: {$gt: Date.now()}})

    if (!userToken) {
        res.status(404)
        throw new Error("invalid token")
    }

    const user = await User.findOne({_id: userToken.userId})
    user.password = password
    await user.save()
    res.status(200).json({message: "password reset successful"})
})

module.exports = {registerUser, loginUser, logout, getUser, loginStatus, updateUser, updatePassword, forgotPassword, resetPassword}