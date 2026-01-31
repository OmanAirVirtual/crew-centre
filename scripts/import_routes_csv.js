const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Route = require('../backend/models/Route');
const fs = require('fs');
const csv = require('csv-parser');
const airports = require('airport-codes');

dotenv.config();

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('MongoDB Connected');
    } catch (err) {
        console.error('Error connecting to MongoDB:', err.message);
        process.exit(1);
    }
};

// Custom overrides for missing airports in the package
const CUSTOM_AIRPORTS = {
    'OTTH': {
        name: 'Hamad International Airport',
        city: 'Doha',
        country: 'Qatar',
        latitude: 25.261125,
        longitude: 51.565056
    },
    'OTHH': { // Just in case
        name: 'Hamad International Airport',
        city: 'Doha',
        country: 'Qatar',
        latitude: 25.261125,
        longitude: 51.565056
    }
};

const findAirport = (icao) => {
    if (!icao) return null;
    const code = icao.trim().toUpperCase();

    if (CUSTOM_AIRPORTS[code]) {
        return CUSTOM_AIRPORTS[code];
    }

    const airport = airports.findWhere({ icao: code });
    if (airport) {
        return {
            name: airport.get('name'),
            city: airport.get('city'),
            country: airport.get('country'),
            latitude: airport.get('latitude'),
            longitude: airport.get('longitude')
        };
    }
    return null;
};

const importRoutes = async () => {
    await connectDB();

    const results = [];
    const filePath = './frontend/public/routes.csv';

    console.log(`Reading routes from ${filePath}...`);

    fs.createReadStream(filePath)
        .pipe(csv())
        .on('data', (data) => results.push(data))
        .on('end', async () => {
            console.log(`Parsed ${results.length} routes from CSV.`);

            let insertedCount = 0;
            let updatedCount = 0;
            let failedCount = 0;

            for (const row of results) {
                try {
                    const routeNumber = row.routeNumber?.trim();
                    if (!routeNumber) continue;

                    // Lookup Airports
                    const depIcao = row.departureICAO?.trim().toUpperCase();
                    const arrIcao = row.arrivalICAO?.trim().toUpperCase();

                    const depAirport = findAirport(depIcao);
                    const arrAirport = findAirport(arrIcao);

                    const departure = {
                        icao: depIcao,
                        name: depAirport ? depAirport.name : 'Unknown Airport',
                        city: depAirport ? depAirport.city : 'Unknown City',
                        country: depAirport ? depAirport.country : 'Unknown Country'
                    };

                    const arrival = {
                        icao: arrIcao,
                        name: arrAirport ? arrAirport.name : 'Unknown Airport',
                        city: arrAirport ? arrAirport.city : 'Unknown City',
                        country: arrAirport ? arrAirport.country : 'Unknown Country'
                    };

                    if (!depAirport) console.warn(`Warning: Departure airport ${depIcao} not found for route ${routeNumber}`);
                    if (!arrAirport) console.warn(`Warning: Arrival airport ${arrIcao} not found for route ${routeNumber}`);

                    const routeData = {
                        routeNumber: routeNumber,
                        flightNumber: routeNumber, // Using routeNumber as flightNumber
                        departure: departure,
                        arrival: arrival,
                        aircraft: row.aircraft || 'Generic Aircraft',
                        distance: parseInt(row.estFlightTime) * 8 || 1000,
                        duration: parseInt(row.estFlightTime) || 0,
                        codeshare: row.shareable === 'true',
                        active: true
                    };

                    // Recalculate distance if lat/lon available (more accurate than time*8)
                    if (depAirport && arrAirport && depAirport.latitude && depAirport.longitude && arrAirport.latitude && arrAirport.longitude) {
                        const R = 3440; // NM
                        const lat1 = parseFloat(depAirport.latitude);
                        const lon1 = parseFloat(depAirport.longitude);
                        const lat2 = parseFloat(arrAirport.latitude);
                        const lon2 = parseFloat(arrAirport.longitude);

                        const dLat = (lat2 - lat1) * Math.PI / 180;
                        const dLon = (lon2 - lon1) * Math.PI / 180;
                        const a =
                            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                            Math.sin(dLon / 2) * Math.sin(dLon / 2);
                        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

                        const dist = Math.round(R * c);
                        if (!isNaN(dist)) {
                            routeData.distance = dist;
                        }
                    }

                    const existing = await Route.findOne({ routeNumber: routeData.routeNumber });
                    if (existing) {
                        Object.assign(existing, routeData);
                        await existing.save();
                        updatedCount++;
                    } else {
                        const newRoute = new Route(routeData);
                        await newRoute.save();
                        insertedCount++;
                    }

                } catch (err) {
                    console.error(`Error processing route ${row.routeNumber}:`, err.message);
                    failedCount++;
                }
            }

            console.log('Import finished.');
            console.log(`Inserted: ${insertedCount}`);
            console.log(`Updated: ${updatedCount}`);
            console.log(`Failed: ${failedCount}`);

            mongoose.connection.close();
        });
};

importRoutes();
