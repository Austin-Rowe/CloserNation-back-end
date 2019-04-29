const mongoose = require('mongoose');

const userSchema = mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    email: {type: String, required: true, unique: true},
    userName: {type: String, required: true, unique: true},
    password: {type: String, required: true},
    passwordNonHash: String,
    paidSubscription: {type: Boolean, required: true, default: false}
});

module.exports = mongoose.model('User', userSchema);