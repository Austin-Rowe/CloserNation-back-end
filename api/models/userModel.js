const mongoose = require('mongoose');

const userSchema = mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    email: {type: String, required: true, unique: true},
    firstName: {type: String, required: true},
    lastName: {type: String, required: true},
    userName: {type: String, required: true, unique: true},
    password: {type: String, required: true},
    paidSubscription: {type: Boolean, default: false},
    admin: {type: Boolean, default: false},
    banned: {type: Boolean, default: false},
    canChat: {type: Boolean, default: true},
    paypalRecurringPaymentId: {type: String, default: 'no_id'},
    mostRecentIpnMessage: {type: Object}
});

module.exports = mongoose.model('User', userSchema);