const mongoose = require('mongoose');

const farmerProfileSchema = new mongoose.Schema({
    userId: { type: String }, // Optional for future Auth integration
    landArea: { type: String, required: true },
    location: { type: String, required: true },
    terrainType: { type: String, required: true },
    irrigationSystem: { type: String, required: true },
    soilType: { type: String, required: true },
    season: { type: String, required: true },
    waterAvailability: { type: String, required: true },
    preferredLanguage: { type: String, default: 'EN' },
    previousCrop: { type: String },
    budget: { type: String },
    farmingExperience: { type: String },
    createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('FarmerProfile', farmerProfileSchema);
