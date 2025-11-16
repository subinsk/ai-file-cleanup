/* eslint-disable @typescript-eslint/no-var-requires */
const fs = require('fs');
const path = require('path');

// Simple ICO file generator for Windows
// Creates a 256x256 icon with a clean design

function createIcoFile(outputPath) {
  // ICO file structure: Header + Directory Entry + BMP/PNG data

  const width = 256;
  const height = 256;
  const bpp = 32; // bits per pixel (RGBA)

  // Create a simple gradient icon with file cleanup theme
  const pixels = Buffer.alloc(width * height * 4);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;

      // Calculate distance from center for circular shape
      const centerX = width / 2;
      const centerY = height / 2;
      const dx = x - centerX;
      const dy = y - centerY;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const maxRadius = width / 2 - 10;

      if (distance <= maxRadius) {
        // Blue gradient for AI/tech feel
        const ratio = distance / maxRadius;
        pixels[idx] = Math.floor(70 + ratio * 30); // R
        pixels[idx + 1] = Math.floor(120 + ratio * 80); // G
        pixels[idx + 2] = Math.floor(200 + ratio * 55); // B
        pixels[idx + 3] = 255; // A (fully opaque)

        // Add a document/file symbol in the center
        const isInnerCircle = distance < maxRadius * 0.4;
        if (isInnerCircle && (Math.abs(dx) < 40 || Math.abs(dy) < 40)) {
          pixels[idx] = 255; // R
          pixels[idx + 1] = 255; // G
          pixels[idx + 2] = 255; // B
          pixels[idx + 3] = 255; // A
        }
      } else {
        // Transparent outside
        pixels[idx] = 0;
        pixels[idx + 1] = 0;
        pixels[idx + 2] = 0;
        pixels[idx + 3] = 0;
      }
    }
  }

  // Create BMP data (bottom-up format)
  const bmpDataSize = width * height * 4;
  const bmpData = Buffer.alloc(bmpDataSize);

  // Flip vertically for BMP format
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const srcIdx = (y * width + x) * 4;
      const dstIdx = ((height - 1 - y) * width + x) * 4;
      bmpData[dstIdx] = pixels[srcIdx + 2]; // B
      bmpData[dstIdx + 1] = pixels[srcIdx + 1]; // G
      bmpData[dstIdx + 2] = pixels[srcIdx]; // R
      bmpData[dstIdx + 3] = pixels[srcIdx + 3]; // A
    }
  }

  // BMP Info Header (40 bytes)
  const infoHeader = Buffer.alloc(40);
  infoHeader.writeUInt32LE(40, 0); // Header size
  infoHeader.writeInt32LE(width, 4); // Width
  infoHeader.writeInt32LE(height * 2, 8); // Height (doubled for icon)
  infoHeader.writeUInt16LE(1, 12); // Planes
  infoHeader.writeUInt16LE(bpp, 14); // Bits per pixel
  infoHeader.writeUInt32LE(0, 16); // Compression (none)
  infoHeader.writeUInt32LE(bmpDataSize, 20); // Image size
  infoHeader.writeInt32LE(0, 24); // X pixels per meter
  infoHeader.writeInt32LE(0, 28); // Y pixels per meter
  infoHeader.writeUInt32LE(0, 32); // Colors used
  infoHeader.writeUInt32LE(0, 36); // Important colors

  // ICO Directory Entry (16 bytes)
  const dirEntry = Buffer.alloc(16);
  dirEntry.writeUInt8(0, 0); // Width (0 = 256)
  dirEntry.writeUInt8(0, 1); // Height (0 = 256)
  dirEntry.writeUInt8(0, 2); // Color palette
  dirEntry.writeUInt8(0, 3); // Reserved
  dirEntry.writeUInt16LE(1, 4); // Color planes
  dirEntry.writeUInt16LE(bpp, 6); // Bits per pixel
  const imageDataSize = infoHeader.length + bmpData.length;
  dirEntry.writeUInt32LE(imageDataSize, 8); // Image size
  dirEntry.writeUInt32LE(22, 12); // Offset (6 + 16)

  // ICO Header (6 bytes)
  const icoHeader = Buffer.alloc(6);
  icoHeader.writeUInt16LE(0, 0); // Reserved
  icoHeader.writeUInt16LE(1, 2); // Type (1 = ICO)
  icoHeader.writeUInt16LE(1, 4); // Number of images

  // Combine all parts
  const icoFile = Buffer.concat([icoHeader, dirEntry, infoHeader, bmpData]);

  fs.writeFileSync(outputPath, icoFile);
  // eslint-disable-next-line no-console
  console.log(`✓ Created ${outputPath}`);
}

function createPngFile(outputPath, size = 512) {
  // Create a simple PNG file with similar design
  const width = size;
  const height = size;

  // Create pixel data
  const pixels = Buffer.alloc(width * height * 4);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;

      const centerX = width / 2;
      const centerY = height / 2;
      const dx = x - centerX;
      const dy = y - centerY;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const maxRadius = width / 2 - 10;

      if (distance <= maxRadius) {
        const ratio = distance / maxRadius;
        pixels[idx] = Math.floor(70 + ratio * 30); // R
        pixels[idx + 1] = Math.floor(120 + ratio * 80); // G
        pixels[idx + 2] = Math.floor(200 + ratio * 55); // B
        pixels[idx + 3] = 255; // A

        const isInnerCircle = distance < maxRadius * 0.4;
        if (isInnerCircle && (Math.abs(dx) < size * 0.15 || Math.abs(dy) < size * 0.15)) {
          pixels[idx] = 255;
          pixels[idx + 1] = 255;
          pixels[idx + 2] = 255;
          pixels[idx + 3] = 255;
        }
      } else {
        pixels[idx] = 0;
        pixels[idx + 1] = 0;
        pixels[idx + 2] = 0;
        pixels[idx + 3] = 0;
      }
    }
  }

  // PNG file structure
  const pngSignature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR chunk
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr.writeUInt8(8, 8); // Bit depth
  ihdr.writeUInt8(6, 9); // Color type (RGBA)
  ihdr.writeUInt8(0, 10); // Compression
  ihdr.writeUInt8(0, 11); // Filter
  ihdr.writeUInt8(0, 12); // Interlace

  const ihdrChunk = createPngChunk('IHDR', ihdr);

  // IDAT chunk (image data) - simplified without compression
  // For simplicity, we'll create a basic structure
  const idat = Buffer.alloc(width * height * 4 + height);
  let pos = 0;
  for (let y = 0; y < height; y++) {
    idat[pos++] = 0; // Filter type: None
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      idat[pos++] = pixels[idx]; // R
      idat[pos++] = pixels[idx + 1]; // G
      idat[pos++] = pixels[idx + 2]; // B
      idat[pos++] = pixels[idx + 3]; // A
    }
  }

  // Use zlib compression
  const zlib = require('zlib');
  const compressedData = zlib.deflateSync(idat);
  const idatChunk = createPngChunk('IDAT', compressedData);

  // IEND chunk
  const iendChunk = createPngChunk('IEND', Buffer.alloc(0));

  const pngFile = Buffer.concat([pngSignature, ihdrChunk, idatChunk, iendChunk]);

  fs.writeFileSync(outputPath, pngFile);
  // eslint-disable-next-line no-console
  console.log(`✓ Created ${outputPath}`);
}

function createPngChunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);

  const typeBuffer = Buffer.from(type, 'ascii');
  const crcData = Buffer.concat([typeBuffer, data]);

  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(calculateCRC(crcData), 0);

  return Buffer.concat([length, typeBuffer, data, crc]);
}

function calculateCRC(data) {
  let crc = 0xffffffff;

  for (let i = 0; i < data.length; i++) {
    crc ^= data[i];
    for (let j = 0; j < 8; j++) {
      if (crc & 1) {
        crc = (crc >>> 1) ^ 0xedb88320;
      } else {
        crc >>>= 1;
      }
    }
  }

  return (crc ^ 0xffffffff) >>> 0;
}

function createIcnsFile(outputPath) {
  // Create a basic ICNS file for macOS
  // ICNS is a container format with multiple PNG images at different sizes

  // eslint-disable-next-line no-console
  console.log(`✓ Created placeholder ${outputPath} (ICNS requires PNG conversion)`);
  // For now, create a simple placeholder - proper ICNS needs more complex processing
  const placeholder = Buffer.from('icns'); // Magic number for ICNS
  fs.writeFileSync(outputPath, placeholder);
}

// Generate all required icons
const assetsDir = path.join(__dirname, 'assets');

// eslint-disable-next-line no-console
console.log('Generating application icons...\n');

createIcoFile(path.join(assetsDir, 'icon.ico'));
createPngFile(path.join(assetsDir, 'icon.png'), 512);
createIcnsFile(path.join(assetsDir, 'icon.icns'));

// eslint-disable-next-line no-console
console.log('\n✓ All icons generated successfully!');
