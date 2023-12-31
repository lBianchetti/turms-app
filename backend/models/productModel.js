const mongoose = require("mongoose")

const productSchema = mongoose.Schema({
        user: {type: mongoose.Schema.Types.ObjectId, required: true, ref: "User"},
        name: {type: String, required: true, trim: true},
        sku: {type: String, required: true, default: "sku", trim: true},
        category: {type: String, required: true, trim: true},
        quantity: {type: String, required: true, trim: true},
        price: {type: String, required: true, trim: true},
        description: {type: String, required: true},
        image: {type: Object, default: {}},
    }, {timestamps: true})

const Product = mongoose.model("Product", productSchema)
module.exports = Product