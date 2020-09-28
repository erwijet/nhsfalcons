let rand = require('./random');

module.exports = function (req) {
    // return true if url contains valid token
    // whitelist /auth because if the user is at /auth, they won't have a key
    return (req.originalUrl == '/auth' || req.query.token == rand.getVal());
}