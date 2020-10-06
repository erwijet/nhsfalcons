const crypto = require('crypto');

module.exports = function () {
    return crypto.createHash('md5').update(new Date() .getDay().toString()).digest('hex');
}