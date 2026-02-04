// Grant bonus funds to specific users
const mongoose = require('mongoose');

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
    console.error('❌ MONGODB_URI not found in environment variables');
    process.exit(1);
}

const TARGET_CALLSIGNS = ['001WY', '002WY', '003WY', '004WY'];
const BONUS_AMOUNT = 100000;

async function grantBonus() {
    try {
        console.log('🔄 Connecting to MongoDB...');
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected successfully\n');

        // Define User schema inline (partial)
        const userSchema = new mongoose.Schema({}, { strict: false });
        const User = mongoose.model('User', userSchema);

        console.log(`💰 Allocating $${BONUS_AMOUNT.toLocaleString()} to ${TARGET_CALLSIGNS.length} users...\n`);

        for (const callsign of TARGET_CALLSIGNS) {
            const user = await User.findOne({ callsign });

            if (!user) {
                console.log(`❌ User ${callsign} not found - Skipping`);
                continue;
            }

            const oldBalance = user.careerEarnings || 0;
            const newBalance = oldBalance + BONUS_AMOUNT;

            await User.updateOne(
                { _id: user._id },
                {
                    $set: {
                        careerEarnings: newBalance
                    }
                }
            );

            console.log(`✅ ${callsign}: $${oldBalance.toLocaleString()} -> $${newBalance.toLocaleString()}`);
        }

        console.log('\n✨ Allocation complete!');
        await mongoose.connection.close();
        process.exit(0);
    } catch (error) {
        console.error('❌ Failed:', error.message);
        process.exit(1);
    }
}

grantBonus();
