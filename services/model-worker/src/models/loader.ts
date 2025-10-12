import { pipeline, env as transformersEnv } from '@xenova/transformers';
import { env } from '../config/env.js';

/**
 * Global model instances
 */
let textModel: any = null;
let imageModel: any = null;

/**
 * Configure transformers.js environment
 */
export function configureTransformers() {
  // Set cache directory for models
  transformersEnv.cacheDir = env.MODEL_CACHE_DIR;
  
  // Use local models if available, otherwise download
  transformersEnv.allowRemoteModels = true;
  
  // Allow local model files
  transformersEnv.allowLocalModels = true;
}

/**
 * Initialize and load all models
 */
export async function initializeModels() {
  configureTransformers();

  console.log('📥 Loading text embedding model...');
  console.log(`   Model: ${env.TEXT_MODEL_NAME}`);
  
  // Load text embedding model (feature-extraction)
  textModel = await pipeline('feature-extraction', env.TEXT_MODEL_NAME);
  
  console.log('✅ Text model loaded');
  console.log(`   Memory: ${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`);

  console.log('📥 Loading image embedding model...');
  console.log(`   Model: ${env.IMAGE_MODEL_NAME}`);
  
  // Load CLIP model for image embeddings
  imageModel = await pipeline('image-feature-extraction', env.IMAGE_MODEL_NAME);
  
  console.log('✅ Image model loaded');
  console.log(`   Memory: ${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`);
}

/**
 * Get text embedding model
 */
export function getTextModel() {
  if (!textModel) {
    throw new Error('Text model not initialized. Call initializeModels() first.');
  }
  return textModel;
}

/**
 * Get image embedding model
 */
export function getImageModel() {
  if (!imageModel) {
    throw new Error('Image model not initialized. Call initializeModels() first.');
  }
  return imageModel;
}

/**
 * Check if models are loaded
 */
export function areModelsLoaded(): boolean {
  return textModel !== null && imageModel !== null;
}

