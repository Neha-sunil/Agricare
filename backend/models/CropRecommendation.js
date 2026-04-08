const mongoose = require('mongoose');

const cropRecommendationSchema = new mongoose.Schema({
    farmerProfileId: { type: mongoose.Schema.Types.ObjectId, ref: 'FarmerProfile', required: true },
    recommendedCrops: [{
        cropName: String,
        reason: String,
        suitabilityScore: Number,
        waterNeed: String,
        careLevel: String,
        timeToHarvest: String,
    }],
    selectedCrop: { type: String, default: null },
    createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('CropRecommendation', cropRecommendationSchema);
