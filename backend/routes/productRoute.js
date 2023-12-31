const express = require("express")
const router = express.Router()

const protect = require("../middleware/authMiddleware")
const { createProduct, getAllProducts, getProduct, deleteProduct, updateProduct } = require("../controllers/productController")
const { upload } = require("../utilities/fileUpload")

router.post("/", protect, createProduct)
router.get("/", protect, getAllProducts)
router.get("/:id", protect, getProduct)
router.delete("/:id", protect, deleteProduct)
router.patch("/:id", protect, updateProduct)






module.exports = router