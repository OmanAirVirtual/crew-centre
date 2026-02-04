// Seed script to populate Type Ratings database
const mongoose = require('mongoose');

const MONGODB_URI = 'mongodb+srv://deepvirtual111:mvZK1Ip4q2Fki8KZ@cluster0.pvkxnw1.mongodb.net/oman_air_virtual?retryWrites=true&w=majority&appName=Cluster0';

const typeRatingsData = [
    {
        typeName: 'A320',
        aircraftFamily: 'A320',
        purchasePrice: 20000,
        baseRate: 150,
        multiplier: 1.2,
        seats: 175,
        description: 'Narrow-body workhorse • Requires First Officer rank',
        rankRequired: 'First Officer',
        status: 'AVAILABLE'
    },
    {
        typeName: 'B737',
        aircraftFamily: 'B737',
        purchasePrice: 22500,
        baseRate: 160,
        multiplier: 1.2,
        seats: 189,
        description: 'Reliable narrow-body • Requires First Officer rank',
        rankRequired: 'First Officer',
        status: 'AVAILABLE'
    },
    {
        typeName: 'B787',
        aircraftFamily: 'B787',
        purchasePrice: 65000,
        baseRate: 250,
        multiplier: 1.8,
        seats: 364,
        description: 'Modern wide-body • Requires Senior Captain rank',
        rankRequired: 'Senior Captain',
        status: 'AVAILABLE'
    },
    {
        typeName: 'B777W',
        aircraftFamily: 'B777',
        purchasePrice: 125000,
        baseRate: 350,
        multiplier: 2.0,
        seats: 503,
        description: 'Heavy wide-body • Requires Elite Captain rank',
        rankRequired: 'Elite Captain',
        status: 'AVAILABLE'
    },
    {
        typeName: 'B747',
        aircraftFamily: 'B747',
        purchasePrice: 225000,
        baseRate: 400,
        multiplier: 2.5,
        seats: 416,
        description: 'Queen of the Skies • Requires Crown Captain rank',
        rankRequired: 'Crown Captain',
        status: 'AVAILABLE'
    },
    {
        typeName: 'B787 (Temporary)',
        aircraftFamily: 'B787',
        purchasePrice: 12000,
        baseRate: 250,
        multiplier: 1.15,
        seats: 364,
        description: 'One-Time Use - Valid for 1 flight only • Try before you buy!',
        rankRequired: 'First Officer',
        status: 'SPECIAL'
    }
];

async function seedTypeRatings() {
    try {
        console.log('🔄 Connecting to MongoDB...');
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected successfully\n');

        const CareerTypeRating = require('./models/CareerTypeRating');

        // Clear existing type ratings
        const deleteCount = await CareerTypeRating.countDocuments();
        if (deleteCount > 0) {
            await CareerTypeRating.deleteMany({});
            console.log(`🗑️  Cleared ${deleteCount} existing type ratings\n`);
        }

        // Insert new type ratings
        console.log('📝 Creating type ratings...');
        for (const rating of typeRatingsData) {
            const created = await CareerTypeRating.create(rating);
            console.log(`   ✓ ${created.typeName} - $${created.purchasePrice.toLocaleString()}`);
        }

        console.log(`\n✅ Successfully created ${typeRatingsData.length} type ratings!`);
        console.log('🎯 Type Ratings page should now display data.\n');

        await mongoose.connection.close();
        process.exit(0);
    } catch (error) {
        console.error('❌ Seed failed:', error.message);
        process.exit(1);
    }
}

seedTypeRatings();
