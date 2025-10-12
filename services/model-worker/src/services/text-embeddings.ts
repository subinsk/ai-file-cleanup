import { getTextModel } from '../models/loader.js';
import { env } from '../config/env.js';

/**
 * Generate text embeddings using the loaded model
 * 
 * @param texts - Array of text strings to embed
 * @returns Array of embedding vectors
 */
export async function generateTextEmbeddings(texts: string[]): Promise<number[][]> {
  if (texts.length === 0) {
    return [];
  }

  // Validate batch size
  if (texts.length > env.MAX_BATCH_SIZE) {
    throw new Error(`Batch size ${texts.length} exceeds maximum ${env.MAX_BATCH_SIZE}`);
  }

  const model = getTextModel();

  try {
    // Generate embeddings for all texts
    const output = await model(texts, {
      pooling: 'mean', // Mean pooling for sentence embeddings
      normalize: true, // L2 normalization
    });

    // Convert to arrays
    const embeddings: number[][] = [];
    
    for (let i = 0; i < texts.length; i++) {
      const embedding = Array.from(output[i]!.data as Float32Array);
      embeddings.push(embedding);
    }

    return embeddings;
  } catch (error) {
    console.error('Text embedding generation failed:', error);
    throw new Error(`Failed to generate text embeddings: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Generate single text embedding
 * 
 * @param text - Text string to embed
 * @returns Embedding vector
 */
export async function generateTextEmbedding(text: string): Promise<number[]> {
  const embeddings = await generateTextEmbeddings([text]);
  return embeddings[0]!;
}

