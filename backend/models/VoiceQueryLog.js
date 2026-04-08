const mongoose = require('mongoose');

const voiceQueryLogSchema = new mongoose.Schema({
    farmerProfileId: { type: mongoose.Schema.Types.ObjectId, ref: 'FarmerProfile' },
    queryText: { type: String, required: true },
    detectedIntent: { type: String },
    createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('VoiceQueryLog', voiceQueryLogSchema);
