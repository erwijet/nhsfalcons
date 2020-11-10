const today = require('./today');
const crypto = require('crypto');

module.exports = function () {
    return crypto.createHash('md5').update(today() + 'adv') .digest('hex');
}