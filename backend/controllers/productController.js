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


const createProduct = asyncHandler(async (req, res) => {
    const { name, sku, category, quantity, price, description } = req.body

    //validation
    if (!name) {
        res.status(400)
        throw new Error("fill name")
    }

    if (!category) {
        res.status(400)
        throw new Error("fill category")
    }

    if (!quantity) {
        res.status(400)
        throw new Error("fill quantity")
    }

    if (!price) {
        res.status(400)
        throw new Error("fill price")
    }

    if (!description) {
        res.status(400)
        throw new Error("fill description")
    }

    //create product 
    const product = await Product.create({
        user: req.user.id,
        name,
        sku,
        category,
        quantity,
        price,
        description,
    })

    res.status(201).json(product)
})

//get all products
const getAllProducts = asyncHandler(async (req, res) => {
    const products = await Product.find().sort("-createdAt")
    res.status(200).json(products)
})

//get silngle product
const getProduct = asyncHandler(async (req, res) => {
    const product = await Product.findById(req.params.id)
    if (!product) {
        res.status(404)
        throw new Error("product not found")
    }

    res.status(200).json(product)
})

//delete product
const deleteProduct = asyncHandler(async (req, res) => {
    const product = await Product.findById(req.params.id)

    if (!product) {
        res.status(404)
        throw new Error("product not found")
    }

    await product.deleteOne()
    res.status(200).json({ message: "Product Deleted" })

})

//upadate product
const updateProduct = asyncHandler(async (req, res) => {
    const product = await Product.findById(req.params.id)

    if (!product) {
        res.status(404)
        throw new Error("product not found")
    }

    const { name, sku, category, quantity, price, description } = req.body

    //update product 
    const updatedProduct = await Product.findByIdAndUpdate(
        {
        _id: req.params.id 
        },
        {
            name,
            sku,
            category,
            quantity,
            price,
            description
        },
        {
            new: true,
            runValidators: true
        }
    )

res.status(200).json(updatedProduct)
})


module.exports = { createProduct, getAllProducts, getProduct, deleteProduct, updateProduct }