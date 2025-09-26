#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 Setting up Finova POS Billing System...\n');

// Check if Node.js is installed
try {
  const nodeVersion = execSync('node --version', { encoding: 'utf8' }).trim();
  console.log(`✅ Node.js ${nodeVersion} detected`);
} catch (error) {
  console.error('❌ Node.js is not installed. Please install Node.js v16 or higher.');
  process.exit(1);
}

// Check if MySQL is available
try {
  execSync('mysql --version', { encoding: 'utf8' });
  console.log('✅ MySQL detected');
} catch (error) {
  console.log('⚠️  MySQL not detected. Please make sure MySQL is installed and running.');
}

// Create uploads directory
const uploadsDir = path.join(__dirname, 'server', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log('✅ Created uploads directory');
}

// Check for .env file
const envPath = path.join(__dirname, 'server', '.env');
if (!fs.existsSync(envPath)) {
  console.log('⚠️  .env file not found. Please copy env.example to .env and configure it.');
} else {
  console.log('✅ .env file found');
}

console.log('\n📋 Next steps:');
console.log('1. Create a MySQL database named "finova_db"');
console.log('2. Copy server/env.example to server/.env and configure it');
console.log('3. Run: cd server && npm install && npm run migrate && npm run seed');
console.log('4. Run: cd ../client && npm install');
console.log('5. Start the server: cd ../server && npm run dev');
console.log('6. Start the client: cd ../client && npm run dev');
console.log('\n🎉 Happy billing with Finova!');

console.log('\n📖 For detailed instructions, see README.md');
