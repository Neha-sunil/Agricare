const mongoose = require('mongoose');

const preCarePlanSchema = new mongoose.Schema({
    farmerProfileId: { type: mongoose.Schema.Types.ObjectId, ref: 'FarmerProfile', required: true },
    selectedCrop: { type: String, required: true },
    soilPreparation: [{ type: String }],
    seedPreparation: [{ type: String }],
    fertilizerPlan: [{ type: String }],
    irrigationPlan: [{ type: String }],
    pestPreventionPlan: [{ type: String }],
    growthMonitoringPlan: [{ type: String }],
    createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('PreCarePlan', preCarePlanSchema);
