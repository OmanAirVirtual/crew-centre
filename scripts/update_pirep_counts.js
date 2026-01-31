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

const updatePirepCounts = async () => {
    await connectDB();

    const results = [];
    const filePath = './frontend/public/members.csv';

    console.log(`Reading members from ${filePath}...`);

    fs.createReadStream(filePath)
        .pipe(csv())
        .on('data', (data) => results.push(data))
        .on('end', async () => {
            console.log(`Parsed ${results.length} members from CSV.`);

            let updatedCount = 0;
            let notFoundCount = 0;

            for (const row of results) {
                try {
                    const callsign = row.callsign?.trim();
                    const pirepCount = parseInt(row.pirepCount) || 0;

                    if (!callsign) continue;

                    // Find user by callsign/username
                    const user = await User.findOne({ username: callsign });

                    if (!user) {
                        console.log(`User ${callsign} not found, skipping...`);
                        notFoundCount++;
                        continue;
                    }

                    // Update totalFlights
                    user.totalFlights = pirepCount;
                    await user.save();

                    console.log(`✓ Updated ${callsign}: totalFlights = ${pirepCount}`);
                    updatedCount++;

                } catch (err) {
                    console.error(`Error processing ${row.callsign}:`, err.message);
                }
            }

            console.log('\n=== Update Complete ===');
            console.log(`Updated: ${updatedCount}`);
            console.log(`Not Found: ${notFoundCount}`);

            mongoose.connection.close();
        });
};

updatePirepCounts();
