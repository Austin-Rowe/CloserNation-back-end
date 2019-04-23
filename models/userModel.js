const mongoose = require('mongoose');

const userSchema = mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    email: String,
    userName: String,
    password: String,
    activeSub: Boolean
})

module.exports = mongoose.model('User', userSchema);