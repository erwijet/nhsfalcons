let rand = require('./random');

module.exports = function (req) {
    return (req.originalUrl == '/auth' || req.query.token == rand.getVal());
}