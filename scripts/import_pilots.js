const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../backend/models/User');
const fs = require('fs');
const csv = require('csv-parser');

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

// Parse flight time string (e.g., "1342h 23m") to decimal hours
function parseFlightTime(timeStr) {
    if (!timeStr || timeStr === 'N/A') return 0;

    const hourMatch = timeStr.match(/(\d+)h/);
    const minMatch = timeStr.match(/(\d+)m/);

    const hours = hourMatch ? parseInt(hourMatch[1]) : 0;
    const minutes = minMatch ? parseInt(minMatch[1]) : 0;

    return hours + (minutes / 60);
}

const excludedCallsigns = ['001WY', '002WY', '004WY', '006WY', '008WY', '010WY', '011WY', '014WY', '015WY'];

const importPilots = async () => {
    await connectDB();

    const results = [];
    const filePath = './frontend/public/members.csv';

    console.log(`Reading members from ${filePath}...`);

    fs.createReadStream(filePath)
        .pipe(csv())
        .on('data', (data) => results.push(data))
        .on('end', async () => {
            console.log(`Parsed ${results.length} members from CSV.`);

            let createdCount = 0;
            let skippedCount = 0;
            let errorCount = 0;

            for (const row of results) {
                try {
                    const callsign = row.callsign?.trim();

                    // Skip if no callsign or if it's in the excluded list
                    if (!callsign || excludedCallsigns.includes(callsign)) {
                        skippedCount++;
                        continue;
                    }

                    // Parse flight time
                    const totalHours = parseFlightTime(row.flightTime);

                    // Ensure password is at least 6 characters (model requirement)
                    const password = callsign.length >= 6 ? callsign : `${callsign}!`;

                    // Create user data
                    const userData = {
                        username: callsign,
                        email: `${callsign.toLowerCase()}@omanairva.com`,
                        password: password, // Will be hashed by the User model
                        firstName: callsign,
                        lastName: '',
                        discordId: 'N/A',
                        callsign: callsign,
                        role: 'pilot',
                        status: 'active',
                        examCompleted: true,
                        examScore: 100,
                        totalHours: totalHours,
                        totalFlights: parseInt(row.pirepCount) || 0
                    };

                    // Check if user already exists
                    const existingUser = await User.findOne({
                        $or: [
                            { email: userData.email },
                            { username: userData.username }
                        ]
                    });

                    if (existingUser) {
                        console.log(`User ${callsign} already exists, skipping...`);
                        skippedCount++;
                        continue;
                    }

                    // Create new user
                    const user = new User(userData);
                    await user.save();

                    console.log(`✓ Created user: ${callsign} (${totalHours.toFixed(1)}h)`);
                    createdCount++;

                } catch (err) {
                    console.error(`Error processing ${row.callsign}:`, err.message);
                    errorCount++;
                }
            }

            console.log('\n=== Import Complete ===');
            console.log(`Created: ${createdCount}`);
            console.log(`Skipped: ${skippedCount}`);
            console.log(`Errors: ${errorCount}`);

            mongoose.connection.close();
        });
};

importPilots();
