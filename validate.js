let rand = require('./random');
let today = require('./today');

module.exports = function (req) {
    // return true if url contains valid token
    // whitelist /auth because if the user is at /auth, they won't have a key
    // return (req.originalUrl == '/auth' || req.query.token == rand.getVal());

    console.log('testing...', req.cookies.nhsfalconsauth, today(), req.cookies.nhsfalconsauth == today());

    return (req.cookies.nhsfalconsauth == today())
}