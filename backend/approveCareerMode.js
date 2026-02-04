// Quick script to approve your CFI account for career mode
// Run this once to set up your account: node approveCareerMode.js

const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

async function approveCareerMode() {
    try {
        const mongoUri = process.env.MONGODB_URI;
        console.log('Connecting to MongoDB...');

        await mongoose.connect(mongoUri);
        console.log('✅ Connected to MongoDB');

        const User = require('./models/User');

        // First, find the user to see if they exist
        const user = await User.findOne({ callsign: '010WY' });

        if (!user) {
            console.log('❌ User not found with callsign 010WY');
            console.log('Please check if the callsign is correct in your database');
            await mongoose.connection.close();
            process.exit(1);
        }

        console.log(`Found user: ${user.firstName} ${user.lastName} (${user.callsign})`);
        console.log(`Current careerModeApproved: ${user.careerModeApproved}`);

        // Update the user
        user.careerModeApproved = true;
        user.careerRank = user.careerRank || 'First Officer';
        user.careerEarnings = user.careerEarnings || 0;
        user.careerTotalDistance = user.careerTotalDistance || 0;
        user.careerTotalTime = user.careerTotalTime || 0;

        await user.save();

        console.log('✅ Career mode approved for callsign 010WY');
        console.log('You can now login to Career Mode with:');
        console.log(`   Callsign: ${user.callsign}`);
        console.log(`   Password: <your account password>`);

        await mongoose.connection.close();
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

approveCareerMode();
