const mongoose = require('mongoose');

const resourceSchema = mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    creator_id: {type: mongoose.Schema.Types.ObjectId, ref: 'User'},
    title: {type: String, default: "Best Closer Show"},
    date: {type: Date, required: true},
    description: {type: String, default: ""},
    fileNames: {type: Object, required: true},
    viewCount: {type: Number, default: 0},
    duration: {type: Number, required: false},
    showNumber: {type: Number, required: true},
    isStreamLink: {type: Boolean, default: false}
});

module.exports = mongoose.model('Resource', resourceSchema);