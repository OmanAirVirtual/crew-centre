const airports = require('airports');
console.log('Total airports:', airports.length);
console.log('First airport:', airports[0]);
console.log('Sample lookup for LHR:', airports.find(a => a.icao === 'EGLL'));
console.log('Sample lookup for OTTH:', airports.find(a => a.icao === 'OTTH'));
console.log('Sample lookup for HAAB:', airports.find(a => a.icao === 'HAAB'));
