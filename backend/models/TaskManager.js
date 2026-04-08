const mongoose = require('mongoose');

const taskManagerSchema = new mongoose.Schema({
    farmerProfileId: { type: mongoose.Schema.Types.ObjectId, ref: 'FarmerProfile', required: true },
    selectedCrop: { type: String, required: true },
    tasks: [{
        title: { type: String, required: true },
        description: { type: String },
        category: { type: String },
        weekNumber: { type: Number, required: true },
        dueDate: { type: Date },
        isCompleted: { type: Boolean, default: false },
        createdAt: { type: Date, default: Date.now }
    }],
    createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('TaskManager', taskManagerSchema);
