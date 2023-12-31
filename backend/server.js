const dotenv = require("dotenv").config()
const express = require("express")
const mongoose = require("mongoose")
const bodyParser = require("body-parser")
const cors = require("cors")
const errorHandler = require("./middleware/errorMiddleware.js")
const cookieParser = require("cookie-parser")
const path = require("path")

const userRoute = require("./routes/userRoute.js")
const productRoute = require("./routes/productRoute.js")
const contactRoute = require("./routes/contactRoute.js")

const app = express()

const PORT = process.env.PORT || 5000

//Middlewares
app.use(express.json())
app.use(cookieParser())
app.use(express.urlencoded({extended: false}))
app.use(bodyParser.json())
app.use(cors({origin: ["http://localhost:3000", "https://turms-app.vercel.app"], credentials: true}))

//Routes Middleware
app.use("/api/users", userRoute)
app.use("/api/products", productRoute)
app.use("/api/contact", contactRoute)

app.use("/uploads", express.static(path.join(__dirname, "uploads")))

//Routes
app.get("/", (req, res) => {
    res.send("home page")
})


//Error Middleware
app.use(errorHandler)

//Connect to MongoDB and start server
mongoose
    .connect(process.env.MONGO_URI)
    .then(() => {
        app.listen(PORT, () => {
            console.log(`Connected on port ${PORT}`)
        })
    })
    .catch((err) => console.log(err))