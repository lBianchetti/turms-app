const multer = require("multer")

//define file storage
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb (null, 'uploads')
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname + "-" + new Date().toISOString().replace(/:/g, "-"))
    }
})

//specify file format that can be saved
function fileFilter(req, file, cb){
    if(file.mimetype === "image/png" || file.mimetype === "image/jpg" || file.mimetype === "image/jpeg"){
        cb(null, false)
    } else {
        cb(null, true)

    }
}

// File Size Formatter
const fileSizeFormatter = (bytes, decimal) => {
    if (bytes === 0) {
      return "0 Bytes";
    }
    const dm = decimal || 2;
    const sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "YB", "ZB"];
    const index = Math.floor(Math.log(bytes) / Math.log(1000));
    return (
      parseFloat((bytes / Math.pow(1000, index)).toFixed(dm)) + " " + sizes[index]
    );
  };
  

const upload = multer({storage, fileFilter})

module.exports = {upload, fileSizeFormatter}