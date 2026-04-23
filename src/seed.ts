/**
 * Seed Script - إنشاء بيانات أولية
 * Run: npx ts-node src/seed.ts
 */
import * as mongoose from 'mongoose';
import * as bcrypt from 'bcryptjs';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/crm_exhibitions';

const UserSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
  role: String,
  isActive: Boolean,
  phone: String,
}, { timestamps: true });

async function seed() {
  console.log('🌱 Starting seed...');
  await mongoose.connect(MONGODB_URI);
  console.log('✅ Connected to MongoDB');

  const User = mongoose.model('User', UserSchema);

  const users = [
    {
      name: 'مدير النظام',
      email: 'admin@exhibitions.com',
      password: await bcrypt.hash('Admin@123', 10),
      role: 'admin',
      isActive: true,
      phone: '0500000001',
    },
    {
      name: 'أحمد المندوب',
      email: 'ahmed@exhibitions.com',
      password: await bcrypt.hash('Agent@123', 10),
      role: 'agent',
      isActive: true,
      phone: '0500000002',
    },
    {
      name: 'سارة المندوبة',
      email: 'sara@exhibitions.com',
      password: await bcrypt.hash('Agent@123', 10),
      role: 'agent',
      isActive: true,
      phone: '0500000003',
    },
    {
      name: 'محمد المندوب',
      email: 'mohammed@exhibitions.com',
      password: await bcrypt.hash('Agent@123', 10),
      role: 'agent',
      isActive: true,
      phone: '0500000004',
    },
  ];

  for (const userData of users) {
    const existing = await User.findOne({ email: userData.email });
    if (existing) {
      console.log(`⏭️  User already exists: ${userData.email}`);
      continue;
    }
    await User.create(userData);
    console.log(`✅ Created: ${userData.name} (${userData.role}) - ${userData.email}`);
  }

  console.log('\n🎉 Seed completed!\n');
  console.log('📋 Login credentials:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('👑 Admin:   admin@exhibitions.com    / Admin@123');
  console.log('👤 Agent 1: ahmed@exhibitions.com    / Agent@123');
  console.log('👤 Agent 2: sara@exhibitions.com     / Agent@123');
  console.log('👤 Agent 3: mohammed@exhibitions.com / Agent@123');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
