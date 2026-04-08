const detectIntent = (query) => {
    const q = query.toLowerCase();

    if (q.includes('crop') || q.includes('choose') || q.includes('grow')) {
        return 'CROP_RECOMMENDATION';
    } else if (q.includes('plan') || q.includes('prepare')) {
        return 'FETCH_PLAN';
    } else if (q.includes('task') || q.includes('next')) {
        return 'FETCH_TASKS';
    } else if (q.includes('fertilizer') || q.includes('npk')) {
        return 'FERTILIZER_INFO';
    } else if (q.includes('water') || q.includes('irrigation')) {
        return 'IRRIGATION_INFO';
    } else if (q.includes('pest') || q.includes('bug')) {
        return 'PEST_INFO';
    }

    return 'GENERAL_HINT';
};

module.exports = { detectIntent };
