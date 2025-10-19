#!/usr/bin/env node

// Environment setup script for WasteWise
const fs = require('fs');
const path = require('path');

console.log('🔧 Setting up WasteWise environment...\n');

// Create .env file if it doesn't exist
const envPath = path.join(__dirname, '.env');
if (!fs.existsSync(envPath)) {
  const envContent = `# Environment Configuration for WasteWise
EXPO_PUBLIC_HOST_URL=http://localhost:3000

# Database Configuration (if needed)
# DATABASE_URL=your_database_url_here

# Other environment variables
NODE_ENV=development
`;
  
  fs.writeFileSync(envPath, envContent);
  console.log('✅ Created .env file');
} else {
  console.log('ℹ️  .env file already exists');
}

// Create public/uploads directory
const uploadsDir = path.join(__dirname, 'public', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log('✅ Created public/uploads directory');
} else {
  console.log('ℹ️  public/uploads directory already exists');
}

console.log('\n🚀 Setup complete! You can now:');
console.log('   • Run "npm run server" to start the API server');
console.log('   • Run "npm run dev" to start both server and Expo');
console.log('   • Run "npm start" to start Expo only');
console.log('\n📡 API will be available at: http://localhost:3000');
console.log('🔗 Health check: http://localhost:3000/health');

