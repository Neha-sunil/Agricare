const generatePreCarePlan = (profile, selectedCrop) => {
    let plan = {
        selectedCrop: selectedCrop,
        soilPreparation: ["Clean field of previous crop debris", "Primary tilling 20-30cm depth", "Secondary harrowing"],
        seedPreparation: ["Selection of healthy seeds", "Seed treatment with fungicide", "Seed soaking if required"],
        fertilizerPlan: ["Initial NPK 15-15-15 application", "Compost/Manure 200kg/rai", "Micronutrient check"],
        irrigationPlan: ["Check drainage system", "Establish watering schedule", "Install drip irrigation if needed"],
        pestPreventionPlan: ["Installation of pheromone traps", "Neem oil application", "Remove weed hosts"],
        growthMonitoringPlan: ["Weekly size measurement", "Leaf color monitoring", "Soil moisture check"]
    };

    // Personalize based on Crop
    if (selectedCrop === 'Rice') {
        plan.soilPreparation.push("Puddling the soil for water retention");
        plan.irrigationPlan.push("Maintain 5-10cm water level in field");
    } else if (selectedCrop === 'Millets' || selectedCrop === 'Maize') {
        plan.soilPreparation.push("Ensure well-drained soil structure");
        plan.irrigationPlan.push("Irrigate every 7-10 days depending on climate");
    }

    // Personalize based on Soil
    if (profile.soilType === 'Clay') {
        plan.soilPreparation.push("Mix in sand if too compact");
    } else if (profile.soilType === 'Sandy') {
        plan.soilPreparation.push("Add organic matter to increase water retention");
    }

    return plan;
};

module.exports = { generatePreCarePlan };
