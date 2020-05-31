require('dotenv').config();
let val;

function advance() {
    val = Math.round(Math.random() * 10000000);
    return val;
}

// needed to get the updated value
function getVal() {
    return val;
}

advance();

module.exports = { getVal, advance };