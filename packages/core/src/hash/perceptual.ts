import { imageHash } from 'image-hash';

/**
 * Calculate perceptual hash (pHash) for an image
 * @param input - Image buffer or file path
 * @returns Promise resolving to perceptual hash string
 */
export async function calculatePerceptualHash(
  input: Buffer | string
): Promise<string> {
  return new Promise((resolve, reject) => {
    // image-hash expects either a buffer or file path
    imageHash(input as any, 16, true, (error: Error | null, data: string) => {
      if (error) {
        reject(error);
      } else {
        resolve(data);
      }
    });
  });
}

/**
 * Calculate hamming distance between two perceptual hashes
 * @param hash1 - First perceptual hash
 * @param hash2 - Second perceptual hash
 * @returns Hamming distance (lower = more similar)
 */
export function hammingDistance(hash1: string, hash2: string): number {
  if (hash1.length !== hash2.length) {
    throw new Error('Hashes must be the same length');
  }
  
  let distance = 0;
  for (let i = 0; i < hash1.length; i++) {
    if (hash1[i] !== hash2[i]) {
      distance++;
    }
  }
  
  return distance;
}

/**
 * Calculate similarity score from hamming distance
 * @param distance - Hamming distance
 * @param hashLength - Length of the hash (default 16 for 16-bit hash)
 * @returns Similarity score between 0 and 1 (higher = more similar)
 */
export function hammingDistanceToSimilarity(
  distance: number,
  hashLength: number = 16
): number {
  // Convert hamming distance to similarity score
  // 0 distance = 1.0 similarity (identical)
  // Max distance = 0.0 similarity (completely different)
  return 1 - distance / hashLength;
}

