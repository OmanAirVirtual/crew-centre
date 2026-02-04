// Add starting funds to a user's career account
const mongoose = require('mongoose');

const MONGODB_URI = 'mongodb+srv://deepvirtual111:mvZK1Ip4q2Fki8KZ@cluster0.pvkxnw1.mongodb.net/oman_air_virtual?retryWrites=true&w=majority&appName=Cluster0';

async function addStartingFunds() {
    try {
        console.log('🔄 Connecting to MongoDB...');
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected successfully\n');

        // Define User schema inline
        const userSchema = new mongoose.Schema({}, { strict: false });
        const User = mongoose.model('User', userSchema);

        // Find user with callsign 010WY
        const user = await User.findOne({ callsign: '010WY' });

        if (!user) {
            console.log('❌ User with callsign 010WY not found');
            await mongoose.connection.close();
            return;
        }

        console.log(`📋 Current Status:`);
        console.log(`   Name: ${user.firstName} ${user.lastName}`);
        console.log(`   Callsign: ${user.callsign}`);
        console.log(`   Current Earnings: $${user.careerEarnings || 0}\n`);

        // Add $100,000 to account
        const newEarnings = (user.careerEarnings || 0) + 100000;

        await User.updateOne(
            { _id: user._id },
            {
                $set: {
                    careerEarnings: newEarnings
                }
            }
        );

        console.log('✅ Starting funds added!');
        console.log(`\n💰 New Balance: $${newEarnings.toLocaleString()}`);
        console.log(`\n🎯 You can now purchase aircraft type ratings!`);

        await mongoose.connection.close();
        process.exit(0);
    } catch (error) {
        console.error('❌ Failed:', error.message);
        process.exit(1);
    }
}

addStartingFunds();
