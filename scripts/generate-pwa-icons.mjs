/**
 * Generate PWA icons for BLKOUT Events
 * Uses the existing logo and creates properly sized icons
 */

import sharp from 'sharp';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync, mkdirSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const PUBLIC_DIR = join(__dirname, '..', 'public');
const SOURCE_LOGO = join(PUBLIC_DIR, 'images', 'blkouthub_logo.png');

// PWA icon sizes
const icons = [
  { name: 'pwa-192x192.png', size: 192 },
  { name: 'pwa-512x512.png', size: 512 },
  { name: 'pwa-maskable-512x512.png', size: 512, maskable: true },
  { name: 'apple-touch-icon.png', size: 180 },
  { name: 'favicon-32x32.png', size: 32 },
  { name: 'favicon-16x16.png', size: 16 },
];

async function generateIcons() {
  console.log('🎨 Generating PWA icons for BLKOUT Events...\n');

  if (!existsSync(SOURCE_LOGO)) {
    console.error('❌ Source logo not found:', SOURCE_LOGO);
    process.exit(1);
  }

  for (const icon of icons) {
    const outputPath = join(PUBLIC_DIR, icon.name);

    try {
      let pipeline = sharp(SOURCE_LOGO)
        .resize(icon.size, icon.size, {
          fit: 'contain',
          background: { r: 0, g: 0, b: 0, alpha: icon.maskable ? 1 : 0 }
        });

      // For maskable icons, add padding (safe zone)
      if (icon.maskable) {
        const innerSize = Math.floor(icon.size * 0.8);
        pipeline = sharp(SOURCE_LOGO)
          .resize(innerSize, innerSize, {
            fit: 'contain',
            background: { r: 0, g: 0, b: 0, alpha: 0 }
          })
          .extend({
            top: Math.floor((icon.size - innerSize) / 2),
            bottom: Math.floor((icon.size - innerSize) / 2),
            left: Math.floor((icon.size - innerSize) / 2),
            right: Math.floor((icon.size - innerSize) / 2),
            background: { r: 0, g: 0, b: 0, alpha: 1 }
          });
      }

      await pipeline.png().toFile(outputPath);
      console.log(`✅ Generated: ${icon.name} (${icon.size}x${icon.size})`);
    } catch (error) {
      console.error(`❌ Failed to generate ${icon.name}:`, error.message);
    }
  }

  console.log('\n🏴‍☠️ PWA icons generated for Black queer liberation!');
}

generateIcons();
