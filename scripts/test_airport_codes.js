const airports = require('airport-codes');

console.log('Testing airport-codes package...');
const doha = airports.where({ city: 'Doha' });
console.log('Airports in Doha:', doha.map(a => `${a.get('name')} (${a.get('icao')})`));

const haab = airports.findWhere({ icao: 'HAAB' });
console.log('HAAB:', haab ? haab.get('name') : 'Not found');
