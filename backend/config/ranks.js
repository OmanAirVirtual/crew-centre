// Rank definitions and progression logic
const RANK_SYSTEM = [
    { name: 'Cadet', hours: 0, multiplier: 1.0, icon: '🛫' },
    { name: 'First Officer', hours: 10, multiplier: 1.2, icon: '🧭' },
    { name: 'Senior First Officer', hours: 50, multiplier: 1.4, icon: '🎖️' },
    { name: 'Captain', hours: 100, multiplier: 1.6, icon: '🪶' },
    { name: 'Senior Captain', hours: 200, multiplier: 1.8, icon: '⭐' },
    { name: 'Elite Captain', hours: 400, multiplier: 2.0, icon: '🏅' },
    { name: 'Crown Captain', hours: 700, multiplier: 2.5, icon: '👑' },
    { name: 'Special Commander', hours: 1000, multiplier: 3.0, icon: '⚔️' },
    { name: 'Falcon Commander', hours: 1500, multiplier: 3.5, icon: '🦅' },
    { name: 'Sultan of the Skies', hours: 2500, multiplier: 5.0, icon: '🏆' }
];

module.exports = { RANK_SYSTEM };
