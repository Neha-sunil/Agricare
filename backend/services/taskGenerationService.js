const generateWeeklyTasks = (selectedCrop, plan) => {
    let tasks = [];

    // Week 1 Tasks
    tasks.push({
        title: "Initial Field Cleanup",
        description: plan.soilPreparation[0],
        category: "Soil Preparation",
        weekNumber: 1
    });
    tasks.push({
        title: "Soil Preparation (Plowing)",
        description: plan.soilPreparation[1],
        category: "Soil Preparation",
        weekNumber: 1
    });
    tasks.push({
        title: "Add Organic Fertilizer",
        description: "Add compost 200kg/rai as recommended.",
        category: "Fertilizer",
        weekNumber: 1
    });

    // Week 2 Tasks
    tasks.push({
        title: "Seed Treatment",
        description: plan.seedPreparation[1],
        category: "Seed Preparation",
        weekNumber: 2
    });
    tasks.push({
        title: "Sowing Seeds",
        description: `Start sowing your ${selectedCrop} seeds at recommended depth.`,
        category: "Planting",
        weekNumber: 2
    });
    tasks.push({
        title: "Start Irrigation",
        description: plan.irrigationPlan[1],
        category: "Irrigation",
        weekNumber: 2
    });

    // Week 3 Tasks
    tasks.push({
        title: "First Application Fertilizer",
        description: plan.fertilizerPlan[0],
        category: "Fertilizer",
        weekNumber: 3
    });
    tasks.push({
        title: "Weeding",
        description: "Manual removal of weeds around seedlings.",
        category: "Maintenance",
        weekNumber: 3
    });
    tasks.push({
        title: "Pest Check",
        description: plan.pestPreventionPlan[1],
        category: "Pest Protection",
        weekNumber: 3
    });

    // Week 4 Tasks
    tasks.push({
        title: "Growth Monitoring Check",
        description: plan.growthMonitoringPlan[0],
        category: "Monitoring",
        weekNumber: 4
    });
    tasks.push({
        title: "Second Irrigation Cycle",
        description: "Maintain moisture based on growth stage.",
        category: "Irrigation",
        weekNumber: 4
    });

    return tasks;
};

module.exports = { generateWeeklyTasks };
