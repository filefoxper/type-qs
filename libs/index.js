if (process.env.NODE_ENV === "production") {
    module.exports = require("../dist/libs.min.js");
} else {
    module.exports = require("../dist/libs.js");
}