const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Route = require('../backend/models/Route');

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

const routeData = {
    routeNumber: 'QR1427',
    flightNumber: 'QR1427',
    departure: {
        icao: 'OTTH',
        name: 'Hamad International Airport',
        city: 'Doha',
        country: 'Qatar'
    },
    arrival: {
        icao: 'HAAB',
        name: 'Addis Ababa Bole International Airport',
        city: 'Addis Ababa',
        country: 'Ethiopia'
    },
    aircraft: 'Generic Airbus A320, Qatar Airways Boeing 777-300ER',
    distance: 1300, // Estimated nautical miles
    duration: 220,
    codeshare: true,
    active: true,
    frequency: 'Daily'
};

const insertRoute = async () => {
    await connectDB();

    try {
        // Check if route exists to avoid duplicates
        const existing = await Route.findOne({ routeNumber: routeData.routeNumber });
        if (existing) {
            console.log(`Route ${routeData.routeNumber} already exists. Updating...`);
            Object.assign(existing, routeData);
            await existing.save();
            console.log('Route updated successfully');
        } else {
            const newRoute = new Route(routeData);
            await newRoute.save();
            console.log('Route added successfully');
        }
    } catch (err) {
        console.error('Error inserting route:', err);
    } finally {
        mongoose.connection.close();
    }
};

insertRoute();
