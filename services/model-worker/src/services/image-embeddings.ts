import { getImageModel } from '../models/loader.js';
import { env } from '../config/env.js';
import sharp from 'sharp';

/**
 * Decode base64 image to buffer
 */
function decodeBase64Image(base64: string): Buffer {
  // Remove data URL prefix if present
  const base64Data = base64.replace(/^data:image\/\w+;base64,/, '');
  return Buffer.from(base64Data, 'base64');
}

/**
 * Preprocess image for CLIP model
 * - Resize to 224x224
 * - Convert to RGB
 */
async function preprocessImage(buffer: Buffer): Promise<Buffer> {
  try {
    return await sharp(buffer)
      .resize(224, 224, {
        fit: 'cover',
        position: 'center',
      })
      .removeAlpha()
      .toColorspace('srgb')
      .raw()
      .toBuffer();
  } catch (error) {
    throw new Error(`Image preprocessing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Generate image embeddings using CLIP model
 * 
 * @param images - Array of base64 encoded images
 * @returns Array of embedding vectors
 */
export async function generateImageEmbeddings(images: string[]): Promise<number[][]> {
  if (images.length === 0) {
    return [];
  }

  // Validate batch size
  if (images.length > env.MAX_BATCH_SIZE) {
    throw new Error(`Batch size ${images.length} exceeds maximum ${env.MAX_BATCH_SIZE}`);
  }

  const model = getImageModel();

  try {
    // Decode and preprocess all images
    const imageBuffers = await Promise.all(
      images.map(async (base64) => {
        const buffer = decodeBase64Image(base64);
        return await preprocessImage(buffer);
      })
    );

    // Generate embeddings
    // Note: transformers.js expects image URLs or buffers
    // For buffers, we need to convert to a format the model accepts
    const embeddings: number[][] = [];

    for (const buffer of imageBuffers) {
      // Convert buffer to data URL for the model
      const base64 = buffer.toString('base64');
      const dataUrl = `data:image/raw;base64,${base64}`;
      
      const output = await model(dataUrl);
      const embedding = Array.from(output.data as Float32Array);
      embeddings.push(embedding);
    }

    return embeddings;
  } catch (error) {
    console.error('Image embedding generation failed:', error);
    throw new Error(`Failed to generate image embeddings: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Generate single image embedding
 * 
 * @param image - Base64 encoded image
 * @returns Embedding vector
 */
export async function generateImageEmbedding(image: string): Promise<number[]> {
  const embeddings = await generateImageEmbeddings([image]);
  return embeddings[0]!;
}

