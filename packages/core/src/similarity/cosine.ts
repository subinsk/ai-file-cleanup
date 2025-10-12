/**
 * Calculate cosine similarity between two vectors
 * Returns value between -1 and 1, where 1 means identical
 * 
 * @param vec1 - First vector
 * @param vec2 - Second vector
 * @returns Cosine similarity score
 */
export function cosineSimilarity(vec1: number[], vec2: number[]): number {
  if (vec1.length !== vec2.length) {
    throw new Error('Vectors must have the same length');
  }
  
  if (vec1.length === 0) {
    throw new Error('Vectors cannot be empty');
  }
  
  let dotProduct = 0;
  let magnitude1 = 0;
  let magnitude2 = 0;
  
  for (let i = 0; i < vec1.length; i++) {
    dotProduct += vec1[i]! * vec2[i]!;
    magnitude1 += vec1[i]! * vec1[i]!;
    magnitude2 += vec2[i]! * vec2[i]!;
  }
  
  magnitude1 = Math.sqrt(magnitude1);
  magnitude2 = Math.sqrt(magnitude2);
  
  if (magnitude1 === 0 || magnitude2 === 0) {
    return 0;
  }
  
  return dotProduct / (magnitude1 * magnitude2);
}

/**
 * Calculate pairwise cosine similarities for multiple vectors
 * Returns matrix where [i][j] is similarity between vectors[i] and vectors[j]
 * 
 * @param vectors - Array of vectors
 * @returns 2D array of similarity scores
 */
export function batchCosineSimilarity(vectors: number[][]): number[][] {
  const n = vectors.length;
  const similarities: number[][] = Array.from({ length: n }, () =>
    Array.from({ length: n }, () => 0)
  );
  
  // Calculate similarities (symmetric matrix)
  for (let i = 0; i < n; i++) {
    similarities[i]![i] = 1.0; // Self-similarity is always 1
    
    for (let j = i + 1; j < n; j++) {
      const sim = cosineSimilarity(vectors[i]!, vectors[j]!);
      similarities[i]![j] = sim;
      similarities[j]![i] = sim; // Symmetric
    }
  }
  
  return similarities;
}

/**
 * Find top K most similar vectors to a query vector
 * 
 * @param queryVector - Query vector
 * @param vectors - Array of vectors to search
 * @param k - Number of top results to return
 * @param threshold - Minimum similarity threshold (default 0)
 * @returns Array of { index, similarity } sorted by similarity (highest first)
 */
export function findTopKSimilar(
  queryVector: number[],
  vectors: number[][],
  k: number,
  threshold: number = 0
): Array<{ index: number; similarity: number }> {
  const similarities = vectors.map((vec, index) => ({
    index,
    similarity: cosineSimilarity(queryVector, vec),
  }));
  
  // Filter by threshold and sort by similarity (descending)
  return similarities
    .filter((item) => item.similarity >= threshold)
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, k);
}

