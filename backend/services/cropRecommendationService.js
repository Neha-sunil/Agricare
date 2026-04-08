const generateRecommendations = (profile) => {
    const recommendations = [];

    // Realistic Rule-Based Mock Logic
    if (profile.irrigationSystem === 'Strong' && profile.soilType === 'Clay' && profile.waterAvailability === 'High') {
        recommendations.push({
            cropName: 'Rice',
            reason: 'Perfect for clay soil with strong irrigation and high water availability.',
            suitabilityScore: 95,
            waterNeed: 'High',
            careLevel: 'Medium',
            timeToHarvest: '110-120 days'
        });
    }

    if (profile.waterAvailability === 'Low' || profile.terrainType === 'Dry') {
        recommendations.push({
            cropName: 'Millets',
            reason: 'Drought-resistant crop suitable for low water availability.',
            suitabilityScore: 90,
            waterNeed: 'Low',
            careLevel: 'Easy',
            timeToHarvest: '70-90 days'
        });
        recommendations.push({
            cropName: 'Groundnut',
            reason: 'Requires less water and suitable for your terrain.',
            suitabilityScore: 85,
            waterNeed: 'Moderate',
            careLevel: 'Medium',
            timeToHarvest: '90-120 days'
        });
    } else {
        recommendations.push({
            cropName: 'Maize',
            reason: 'Grows well in moderate weather and medium land conditions.',
            suitabilityScore: 88,
            waterNeed: 'Moderate',
            careLevel: 'Easy',
            timeToHarvest: '100-110 days'
        });
    }

    // Add some default options if nothing specific matches
    if (recommendations.length < 2) {
        recommendations.push({
            cropName: 'Tomato',
            reason: 'Versatile crop that works well with most seasonal shifts in your area.',
            suitabilityScore: 80,
            waterNeed: 'Moderate',
            careLevel: 'High',
            timeToHarvest: '60-80 days'
        });
    }

    return recommendations;
};

module.exports = { generateRecommendations };
