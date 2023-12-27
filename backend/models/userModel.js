const mongoose = require("mongoose")
const bcrypt = require("bcryptjs")

const userSchema = mongoose.Schema({
    name: { type: String, require: [true, "Enter a Name"]},
    email: { type: String, require: [true, "Enter a Email"], unique: true, trim: true, match: [/^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|.(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/, "Enter a valid Email"]},
    password: {type: String, require: [true, "Enter a Password"]}
}, {
    timestamps: true
})

    //Encrypt password
    userSchema.pre("save", async function(next){
    if(!this.isModified("password")){
        return next()
    }
    //Hash password
    const salt = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash(this.password, salt)
    this.password = hashedPassword
    next()
    })

const User = mongoose.model("User", userSchema)
module.exports = User