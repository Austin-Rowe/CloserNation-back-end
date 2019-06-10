const mongoose = require('mongoose');

const resourceSchema = mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    title: {type: String, default: "Closer Nation Resource"},
    creator_id: {type: mongoose.Schema.Types.ObjectId, ref: 'User'},
    URL: {type: String, required: true},
    description: {type: String, default: "Podcast discussing the political issues our nation is currently facing."},
    isStreamLink: {type: Boolean, default: false}
});

module.exports = mongoose.model('Resource', resourceSchema);