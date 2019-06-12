const mongoose = require('mongoose');

const ipnSchema = mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    ipn: {type: Object}
});

module.exports = mongoose.model('IPN', ipnSchema);