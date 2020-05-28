if (process.env.NODE_ENV === "production") {
    module.exports = require("./dist/type-qs.min.js");
} else {
    module.exports = require("./dist/type-qs.js");
}