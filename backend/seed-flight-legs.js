// Seed script to populate Flight Legs database with Dubai routes
const mongoose = require('mongoose');

const MONGODB_URI = 'mongodb+srv://deepvirtual111:mvZK1Ip4q2Fki8KZ@cluster0.pvkxnw1.mongodb.net/oman_air_virtual?retryWrites=true&w=majority&appName=Cluster0';

// Sample flight legs data - Dubai based routes
const flightLegsData = [
    // A320 Family flights (Short/Medium Haul from Dubai)
    {
        legIdentifier: 'LEG 1',
        flightNumber: 'OV101',
        origin: 'OMDB',
        destination: 'OOMS',
        aircraftType: 'A320',
        aircraftFamily: 'A320',
        distance: 182,
        estimatedFlightTime: 0.8,
        status: 'COMPLETED'
    },
    {
        legIdentifier: 'LEG 2',
        flightNumber: 'OV102',
        origin: 'OOMS',
        destination: 'OMDB',
        aircraftType: 'A320',
        aircraftFamily: 'A320',
        distance: 182,
        estimatedFlightTime: 0.8,
        status: 'COMPLETED'
    },
    {
        legIdentifier: 'LEG 3',
        flightNumber: 'OV234',
        origin: 'OMDB',
        destination: 'OBBI',
        aircraftType: 'A320',
        aircraftFamily: 'A320',
        distance: 263,
        estimatedFlightTime: 1.0,
        status: 'DISPATCHED'
    },
    {
        legIdentifier: 'LEG 4',
        flightNumber: 'OV235',
        origin: 'OBBI',
        destination: 'OTHH',
        aircraftType: 'A320',
        aircraftFamily: 'A320',
        distance: 79,
        estimatedFlightTime: 0.5,
        status: 'AVAILABLE'
    },
    {
        legIdentifier: 'LEG 5',
        flightNumber: 'OV240',
        origin: 'OMDB',
        destination: 'OEDF',
        aircraftType: 'A320',
        aircraftFamily: 'A320',
        distance: 305,
        estimatedFlightTime: 1.1,
        status: 'AVAILABLE'
    },
    {
        legIdentifier: 'LEG 6',
        flightNumber: 'OV250',
        origin: 'OMDB',
        destination: 'OEJN',
        aircraftType: 'A320',
        aircraftFamily: 'A320',
        distance: 890,
        estimatedFlightTime: 2.5,
        status: 'AVAILABLE'
    },

    // B737 Family flights
    {
        legIdentifier: 'LEG 7',
        flightNumber: 'OV301',
        origin: 'OMDB',
        destination: 'OKBK',
        aircraftType: 'B738',
        aircraftFamily: 'B737',
        distance: 457,
        estimatedFlightTime: 1.5,
        status: 'AVAILABLE'
    },
    {
        legIdentifier: 'LEG 8',
        flightNumber: 'OV302',
        origin: 'OKBK',
        destination: 'OMDB',
        aircraftType: 'B738',
        aircraftFamily: 'B737',
        distance: 457,
        estimatedFlightTime: 1.5,
        status: 'AVAILABLE'
    },

    // B787 Family flights (Long Haul from Dubai)
    {
        legIdentifier: 'LEG 9',
        flightNumber: 'OV401',
        origin: 'OMDB',
        destination: 'EGLL',
        aircraftType: 'B789',
        aircraftFamily: 'B787',
        distance: 3000,
        estimatedFlightTime: 7.5,
        status: 'AVAILABLE'
    },
    {
        legIdentifier: 'LEG 10',
        flightNumber: 'OV402',
        origin: 'EGLL',
        destination: 'OMDB',
        aircraftType: 'B789',
        aircraftFamily: 'B787',
        distance: 3000,
        estimatedFlightTime: 7.2,
        status: 'AVAILABLE'
    },
    {
        legIdentifier: 'LEG 11',
        flightNumber: 'OV405',
        origin: 'OMDB',
        destination: 'VTBS',
        aircraftType: 'B789',
        aircraftFamily: 'B787',
        distance: 2600,
        estimatedFlightTime: 6.5,
        status: 'AVAILABLE'
    },

    // Special B777 Route
    {
        legIdentifier: 'LEG 12',
        flightNumber: 'OV500',
        origin: 'OMDB',
        destination: 'KJFK',
        aircraftType: 'B77W',
        aircraftFamily: 'B777',
        distance: 6000,
        estimatedFlightTime: 14.5,
        status: 'LOCKED'
    }
];

async function seedFlightLegs() {
    try {
        console.log('🔄 Connecting to MongoDB...');
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected successfully\n');

        const CareerFlight = require('./models/CareerFlight');

        // Clear existing flight legs
        const deleteCount = await CareerFlight.countDocuments();
        if (deleteCount > 0) {
            await CareerFlight.deleteMany({});
            console.log(`🗑️  Cleared ${deleteCount} existing flight legs\n`);
        }

        // Insert new flight legs
        console.log('📝 Creating flight legs...');
        for (const leg of flightLegsData) {
            const created = await CareerFlight.create(leg);
            console.log(`   ✓ ${created.legIdentifier} - ${created.origin} → ${created.destination} (${created.aircraftType}) - ${created.status}`);
        }

        console.log(`\n✅ Successfully created ${flightLegsData.length} flight legs!`);
        console.log('🎯 Flight Legs page should now display routes.\n');

        await mongoose.connection.close();
        process.exit(0);
    } catch (error) {
        console.error('❌ Seed failed:', error.message);
        process.exit(1);
    }
}

seedFlightLegs();
