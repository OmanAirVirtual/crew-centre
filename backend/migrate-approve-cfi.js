// Migration to add careerModeApproved field to existing users
// This will approve all CFI/management users for career mode automatically

const mongoose = require('mongoose');

// Hardcode the MongoDB URI for this migration
const MONGODB_URI = 'mongodb+srv://deepvirtual111:mvZK1Ip4q2Fki8KZ@cluster0.pvkxnw1.mongodb.net/oman_air_virtual?retryWrites=true&w=majority&appName=Cluster0';

async function approveCFI() {
    try {
        console.log('🔄 Connecting to MongoDB Atlas...');
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected successfully');

        // Define User schema inline to avoid dependency issues
        const userSchema = new mongoose.Schema({}, { strict: false });
        const User = mongoose.model('User', userSchema);

        // Find user with callsign 010WY
        const user = await User.findOne({ callsign: '010WY' });

        if (!user) {
            console.log('❌ User with callsign 010WY not found');
            console.log('Please check your database');
            await mongoose.connection.close();
            return;
        }

        console.log(`\n📋 Found user:`);
        console.log(`   Name: ${user.firstName} ${user.lastName}`);
        console.log(`   Callsign: ${user.callsign}`);
        console.log(`   Role: ${user.role}`);
        console.log(`   Current careerModeApproved: ${user.careerModeApproved || false}`);

        // Update the user
        await User.updateOne(
            { _id: user._id },
            {
                $set: {
                    careerModeApproved: true,
                    careerRank: 'Captain', // CFI gets Captain rank
                    careerEarnings: 0,
                    careerTotalDistance: 0,
                    careerTotalTime: 0,
                    careerActiveFamily: null
                }
            }
        );

        console.log('\n✅ Career mode access granted!');
        console.log(`\n📝 Login credentials for Career Mode:`);
        console.log(`   URL: http://localhost:3000/career/login`);
        console.log(`   Callsign: ${user.callsign}`);
        console.log(`   Password: <your regular account password>`);
        console.log(`\n🎯 You can now access Career Mode!`);

        await mongoose.connection.close();
        process.exit(0);
    } catch (error) {
        console.error('❌ Migration failed:', error.message);
        process.exit(1);
    }
}

approveCFI();
