// Simple script to create placeholder PNG files for Expo
const fs = require('fs');
const path = require('path');

// Minimal valid PNG (1x1 pixel, indigo color #6366f1)
const createPNG = (width, height) => {
  // This creates a minimal valid PNG header
  // For production, replace with actual images
  const png = Buffer.from([
    0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, // PNG signature
    0x00, 0x00, 0x00, 0x0D, // IHDR length
    0x49, 0x48, 0x44, 0x52, // IHDR
    0x00, 0x00, 0x00, 0x01, // width = 1
    0x00, 0x00, 0x00, 0x01, // height = 1
    0x08, 0x02, // bit depth = 8, color type = 2 (RGB)
    0x00, 0x00, 0x00, // compression, filter, interlace
    0x90, 0x77, 0x53, 0xDE, // CRC
    0x00, 0x00, 0x00, 0x0C, // IDAT length
    0x49, 0x44, 0x41, 0x54, // IDAT
    0x08, 0xD7, 0x63, 0x60, 0x60, 0x60, 0x00, 0x00, 0x00, 0x04, 0x00, 0x01, // compressed data
    0x27, 0x34, 0x27, 0x0A, // CRC
    0x00, 0x00, 0x00, 0x00, // IEND length
    0x49, 0x45, 0x4E, 0x44, // IEND
    0xAE, 0x42, 0x60, 0x82  // CRC
  ]);
  return png;
};

const assetsDir = path.join(__dirname, '..', 'assets');

// Create placeholder files
const files = [
  'icon.png',
  'splash.png', 
  'adaptive-icon.png',
  'favicon.png',
  'notification-icon.png'
];

files.forEach(file => {
  const filePath = path.join(assetsDir, file);
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, createPNG());
    console.log(`Created: ${file}`);
  } else {
    console.log(`Exists: ${file}`);
  }
});

console.log('\n✅ Asset placeholders created!');
console.log('📝 Replace these with actual images for production.');

