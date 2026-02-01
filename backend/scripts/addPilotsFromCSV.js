const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config({ path: '../.env' });

const pilots = [
    {
        callsign: '002WY',
        firstName: '002WY',
        username: '002WY',
        email: '002wy@omanairva.com',
        password: 'staff!',
        flightTime: '261h 12m',
        totalHours: 261.2,
        pirepCount: 13
    },
    {
        callsign: '004WY',
        firstName: '004WY',
        username: '004WY',
        email: '004wy@omanairva.com',
        password: 'staff!',
        flightTime: '338h 23m',
        totalHours: 338.38,
        pirepCount: 4
    },
    {
        callsign: '006WY',
        firstName: '006WY',
        username: '006WY',
        email: '006wy@omanairva.com',
        password: 'staff!',
        flightTime: '721h 27m',
        totalHours: 721.45,
        pirepCount: 68
    },
    {
        callsign: '008WY',
        firstName: '008WY',
        username: '008WY',
        email: '008wy@omanairva.com',
        password: 'staff!',
        flightTime: '22h 8m',
        totalHours: 22.13,
        pirepCount: 2
    },
    {
        callsign: '010WY',
        firstName: '010WY',
        username: '010WY',
        email: '010wy@omanairva.com',
        password: 'staff!',
        flightTime: '0h 0m',
        totalHours: 0,
        pirepCount: 0
    },
    {
        callsign: '011WY',
        firstName: '011WY',
        username: '011WY',
        email: '011wy@omanairva.com',
        password: 'staff!',
        flightTime: '247h 5m',
        totalHours: 247.08,
        pirepCount: 16
    },
    {
        callsign: '014WY',
        firstName: '014WY',
        username: '014WY',
        email: '014wy@omanairva.com',
        password: 'staff!',
        flightTime: '0h 0m',
        totalHours: 0,
        pirepCount: 0
    },
    {
        callsign: '015WY',
        firstName: '015WY',
        username: '015WY',
        email: '015wy@omanairva.com',
        password: 'staff!',
        flightTime: '92h 38m',
        totalHours: 92.63,
        pirepCount: 11
    }
];

async function addPilots() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        for (const pilot of pilots) {
            // Check if user already exists
            const existingUser = await User.findOne({
                $or: [{ email: pilot.email }, { username: pilot.username }]
            });

            if (existingUser) {
                console.log(`User ${pilot.username} already exists, skipping...`);
                continue;
            }

            // Generate a unique discord ID (using timestamp + random number)
            const discordId = `${Date.now()}${Math.floor(Math.random() * 1000)}`;

            const newUser = new User({
                username: pilot.username,
                email: pilot.email,
                discordId: discordId,
                password: pilot.password,
                firstName: pilot.firstName,
                lastName: '',
                callsign: pilot.callsign,
                role: 'pilot',
                status: 'active',
                examCompleted: true,
                examScore: 0,
                totalHours: pilot.totalHours,
                totalFlights: pilot.pirepCount
            });

            await newUser.save();
            console.log(`✓ Created account for ${pilot.username} (${pilot.email}) - ${pilot.flightTime} flight time`);
        }

        console.log('\n✓ All pilots added successfully!');
        process.exit(0);
    } catch (error) {
        console.error('Error adding pilots:', error);
        process.exit(1);
    }
}

addPilots();
