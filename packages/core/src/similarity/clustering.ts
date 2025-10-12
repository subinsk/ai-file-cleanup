import { cosineSimilarity } from './cosine';

/**
 * Item with embedding for clustering
 */
export interface ClusterItem<T = unknown> {
  id: string;
  data: T;
  embedding: number[];
}

/**
 * Cluster of similar items
 */
export interface Cluster<T = unknown> {
  id: string;
  items: ClusterItem<T>[];
  representative: ClusterItem<T>; // Most representative item (centroid)
}

/**
 * Cluster similar items using single-linkage clustering
 * Groups items where at least one pair exceeds the similarity threshold
 * 
 * @param items - Items with embeddings to cluster
 * @param threshold - Minimum similarity threshold for grouping
 * @returns Array of clusters
 */
export function clusterSimilarItems<T>(
  items: ClusterItem<T>[],
  threshold: number
): Cluster<T>[] {
  if (items.length === 0) {
    return [];
  }
  
  // Initialize each item in its own cluster
  const clusters: Set<string>[] = items.map((_, i) => new Set([String(i)]));
  
  // Single-linkage clustering: merge clusters if any pair exceeds threshold
  for (let i = 0; i < items.length; i++) {
    for (let j = i + 1; j < items.length; j++) {
      const sim = cosineSimilarity(items[i]!.embedding, items[j]!.embedding);
      
      if (sim >= threshold) {
        // Find clusters containing i and j
        const clusterI = clusters.findIndex((c) => c.has(String(i)));
        const clusterJ = clusters.findIndex((c) => c.has(String(j)));
        
        if (clusterI !== clusterJ && clusterI !== -1 && clusterJ !== -1) {
          // Merge clusters
          const merged = new Set([...clusters[clusterI]!, ...clusters[clusterJ]!]);
          clusters[clusterI] = merged;
          clusters.splice(clusterJ, 1);
        }
      }
    }
  }
  
  // Convert cluster indices to actual items
  return clusters.map((clusterIndices, idx) => {
    const clusterItems = Array.from(clusterIndices).map((i) => items[Number(i)]!);
    const representative = selectRepresentative(clusterItems);
    
    return {
      id: `cluster-${idx}`,
      items: clusterItems,
      representative,
    };
  });
}

/**
 * Select the most representative item from a cluster
 * Uses the item closest to the centroid
 * 
 * @param items - Items in the cluster
 * @returns Most representative item
 */
function selectRepresentative<T>(items: ClusterItem<T>[]): ClusterItem<T> {
  if (items.length === 1) {
    return items[0]!;
  }
  
  // Calculate centroid (mean of all embeddings)
  const embeddingDim = items[0]!.embedding.length;
  const centroid = new Array(embeddingDim).fill(0);
  
  for (const item of items) {
    for (let i = 0; i < embeddingDim; i++) {
      centroid[i] += item.embedding[i]!;
    }
  }
  
  for (let i = 0; i < embeddingDim; i++) {
    centroid[i] /= items.length;
  }
  
  // Find item closest to centroid
  let maxSimilarity = -1;
  let representative = items[0]!;
  
  for (const item of items) {
    const sim = cosineSimilarity(item.embedding, centroid);
    if (sim > maxSimilarity) {
      maxSimilarity = sim;
      representative = item;
    }
  }
  
  return representative;
}

/**
 * Group items into clusters and extract single items
 * Returns both clusters (size > 1) and singletons (size = 1)
 * 
 * @param items - Items to cluster
 * @param threshold - Similarity threshold
 * @returns Object with clusters and singletons
 */
export function groupItems<T>(
  items: ClusterItem<T>[],
  threshold: number
): {
  clusters: Cluster<T>[];
  singletons: ClusterItem<T>[];
} {
  const allClusters = clusterSimilarItems(items, threshold);
  
  const clusters = allClusters.filter((c) => c.items.length > 1);
  const singletons = allClusters
    .filter((c) => c.items.length === 1)
    .map((c) => c.items[0]!);
  
  return { clusters, singletons };
}

