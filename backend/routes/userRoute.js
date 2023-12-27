const express = require("express")
const router = express.Router()
const { registerUser, loginUser, logout, getUser, loginStatus, updateUser, updatePassword, resetPassword, forgotPassword } = require("../controllers/userController")
const protect = require("../middleware/authMiddleware")
 
router.post("/register", registerUser)
router.post("/login", loginUser)
router.get("/logout", logout)
router.get("/getuser", protect, getUser)
router.get("/loginstatus", loginStatus) //changed from loggedin
router.patch("/updateuser", protect, updateUser)
router.patch("/updatepassword", protect, updatePassword) //changed from changepassword
router.post("/forgotpassword", forgotPassword)
router.put("/resetpassword/:resetToken", resetPassword)




module.exports = router