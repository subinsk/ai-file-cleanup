import sharp from 'sharp';

/**
 * Normalize image for AI model input
 * - Resize to target size (default 224x224 for CLIP)
 * - Convert to RGB
 * - Return as buffer
 * 
 * @param buffer - Input image buffer
 * @param targetSize - Target size for longest side (default 224)
 * @returns Promise resolving to preprocessed image buffer
 */
export async function normalizeImage(
  buffer: Buffer,
  targetSize: number = 224
): Promise<Buffer> {
  try {
    const image = sharp(buffer);
    
    // Resize maintaining aspect ratio
    const resized = image.resize(targetSize, targetSize, {
      fit: 'inside', // Maintain aspect ratio
      withoutEnlargement: false, // Allow upscaling if needed
    });
    
    // Convert to RGB and output as PNG
    const normalized = await resized
      .removeAlpha() // Remove alpha channel
      .toColorspace('srgb') // Ensure sRGB color space
      .png()
      .toBuffer();
    
    return normalized;
  } catch (error) {
    throw new Error(`Failed to normalize image: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Create thumbnail from image
 * @param buffer - Input image buffer
 * @param size - Thumbnail size (default 150)
 * @returns Promise resolving to thumbnail buffer
 */
export async function createThumbnail(
  buffer: Buffer,
  size: number = 150
): Promise<Buffer> {
  try {
    return await sharp(buffer)
      .resize(size, size, {
        fit: 'cover',
        position: 'center',
      })
      .jpeg({ quality: 80 })
      .toBuffer();
  } catch (error) {
    throw new Error(`Failed to create thumbnail: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Get image dimensions
 * @param buffer - Input image buffer
 * @returns Promise resolving to { width, height }
 */
export async function getImageDimensions(
  buffer: Buffer
): Promise<{ width: number; height: number }> {
  try {
    const metadata = await sharp(buffer).metadata();
    return {
      width: metadata.width || 0,
      height: metadata.height || 0,
    };
  } catch (error) {
    throw new Error(`Failed to get image dimensions: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

