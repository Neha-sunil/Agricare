const FarmerProfile = require('../models/FarmerProfile');
const CropRecommendation = require('../models/CropRecommendation');
const PreCarePlan = require('../models/PreCarePlan');
const TaskManager = require('../models/TaskManager');
const VoiceQueryLog = require('../models/VoiceQueryLog');

const { generateRecommendations } = require('../services/cropRecommendationService');
const { generatePreCarePlan } = require('../services/preCarePlanService');
const { generateWeeklyTasks } = require('../services/taskGenerationService');
const { detectIntent } = require('../services/voiceIntentService');

// @desc Save farmer farm profile
// @route POST /api/precare/profile
exports.saveProfile = async (req, res) => {
    try {
        const profile = new FarmerProfile(req.body);
        await profile.save();
        res.status(201).json({ success: true, profileId: profile._id });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// @desc Generate crop recommendations
// @route POST /api/precare/recommend-crops
exports.recommendCrops = async (req, res) => {
    try {
        const { farmerProfileId } = req.body;
        const profile = await FarmerProfile.findById(farmerProfileId);
        
        if (!profile) return res.status(404).json({ error: "Profile not found" });

        const recommendationsList = generateRecommendations(profile);
        
        const recommendationDoc = new CropRecommendation({
            farmerProfileId,
            recommendedCrops: recommendationsList
        });
        
        await recommendationDoc.save();
        res.json({ success: true, recommendations: recommendationsList });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// @desc Select one recommended crop
// @route POST /api/precare/select-crop
exports.selectCrop = async (req, res) => {
    try {
        const { farmerProfileId, selectedCrop } = req.body;
        
        const recDoc = await CropRecommendation.findOne({ farmerProfileId }).sort({ createdAt: -1 });
        if (!recDoc) return res.status(404).json({ error: "Recommendation not found" });

        recDoc.selectedCrop = selectedCrop;
        await recDoc.save();
        
        res.json({ success: true, selectedCrop });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// @desc Generate pre-care plan
// @route POST /api/precare/generate-plan
exports.generatePlan = async (req, res) => {
    try {
        const { farmerProfileId, selectedCrop } = req.body;
        const profile = await FarmerProfile.findById(farmerProfileId);
        
        const planData = generatePreCarePlan(profile, selectedCrop);
        
        const planDoc = new PreCarePlan({
            farmerProfileId,
            ...planData
        });
        
        await planDoc.save();
        res.json({ success: true, plan: planDoc });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// @desc Generate weekly tasks from plan
// @route POST /api/precare/generate-tasks
exports.generateTasks = async (req, res) => {
    try {
        const { farmerProfileId, selectedCrop } = req.body;
        const plan = await PreCarePlan.findOne({ farmerProfileId, selectedCrop }).sort({ createdAt: -1 });

        if (!plan) return res.status(404).json({ error: "Plan not found" });

        const taskList = generateWeeklyTasks(selectedCrop, plan);
        
        const taskDoc = new TaskManager({
            farmerProfileId,
            selectedCrop,
            tasks: taskList
        });

        await taskDoc.save();
        res.json({ success: true, tasks: taskList });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// @desc Fetch complete dashboard data
// @route GET /api/precare/dashboard/:farmerProfileId
exports.getDashboard = async (req, res) => {
    try {
        const { farmerProfileId } = req.params;
        
        const profile = await FarmerProfile.findById(farmerProfileId);
        const recommendations = await CropRecommendation.findOne({ farmerProfileId }).sort({ createdAt: -1 });
        const plan = await PreCarePlan.findOne({ farmerProfileId }).sort({ createdAt: -1 });
        const taskDoc = await TaskManager.findOne({ farmerProfileId }).sort({ createdAt: -1 });

        res.json({
            profile,
            recommendation: recommendations ? recommendations.recommendedCrops : [],
            selectedCrop: recommendations ? recommendations.selectedCrop : null,
            preCarePlan: plan,
            tasks: taskDoc ? taskDoc.tasks : [],
            progress: taskDoc ? ((taskDoc.tasks.filter(t=>t.isCompleted).length / taskDoc.tasks.length) * 100).toFixed(0) : 0
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// @desc Update task completeness
// @route PATCH /api/precare/task/:taskId
exports.updateTask = async (req, res) => {
    try {
        const { taskId } = req.params;
        const { isCompleted, farmerProfileId } = req.body;

        const taskDoc = await TaskManager.findOne({ farmerProfileId });
        const task = taskDoc.tasks.id(taskId);
        task.isCompleted = isCompleted;
        
        await taskDoc.save();
        res.json({ success: true, tasks: taskDoc.tasks });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// @desc Voice query intent detection
// @route POST /api/precare/voice-query
exports.voiceQuery = async (req, res) => {
    try {
        const { farmerProfileId, queryText } = req.body;
        const detectedIntent = detectIntent(queryText);

        const log = new VoiceQueryLog({
            farmerProfileId,
            queryText,
            detectedIntent
        });
        await log.save();

        res.json({
            detectedIntent,
            hint: "Proceed based on intent provided"
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
