import type { FileMetadata, DedupeGroup, DuplicateMatch } from '@ai-cleanup/types';
import { SIMILARITY_THRESHOLDS } from '@ai-cleanup/types';
import { clusterSimilarItems, type ClusterItem } from '../similarity/clustering';
import { selectKeepFile } from './tie-breaker';
import { explainMatch } from './explainer';

/**
 * File with embedding data for deduplication
 */
export interface FileWithEmbedding extends FileMetadata {
  embedding?: number[]; // Text or image embedding
}

/**
 * Group duplicate files based on embeddings and hash matching
 * 
 * @param files - Files with embedding data
 * @param threshold - Similarity threshold (default: HIGH_SIMILARITY)
 * @returns Dedupe groups with keep/duplicate files
 */
export function groupDuplicates(
  files: FileWithEmbedding[],
  threshold: number = SIMILARITY_THRESHOLDS.HIGH_SIMILARITY
): DedupeGroup[] {
  if (files.length === 0) {
    return [];
  }
  
  // First, group by exact hash matches
  const hashGroups = groupByHash(files);
  
  // Then, for files with embeddings, cluster by similarity
  const embeddingGroups: FileWithEmbedding[][] = [];
  
  for (const hashGroup of hashGroups) {
    if (hashGroup.length === 1 && hashGroup[0]!.embedding) {
      // Single file with embedding - check similarity with others
      embeddingGroups.push(hashGroup);
    } else if (hashGroup.length > 1) {
      // Multiple files with same hash - already a group
      embeddingGroups.push(hashGroup);
    }
  }
  
  // Cluster files with embeddings
  const filesWithEmbeddings = files.filter((f) => f.embedding && f.embedding.length > 0);
  
  if (filesWithEmbeddings.length > 0) {
    const clusterItems: ClusterItem<FileWithEmbedding>[] = filesWithEmbeddings.map((f) => ({
      id: f.id,
      data: f,
      embedding: f.embedding!,
    }));
    
    const clusters = clusterSimilarItems(clusterItems, threshold);
    
    // Add clusters with more than 1 item
    for (const cluster of clusters) {
      if (cluster.items.length > 1) {
        embeddingGroups.push(cluster.items.map((item) => item.data));
      }
    }
  }
  
  // Convert to dedupe groups
  return embeddingGroups
    .filter((group) => group.length > 1)
    .map((group, index) => createDedupeGroup(group, index));
}

/**
 * Group files by SHA-256 hash (exact duplicates)
 */
function groupByHash(files: FileWithEmbedding[]): FileWithEmbedding[][] {
  const hashMap = new Map<string, FileWithEmbedding[]>();
  
  for (const file of files) {
    const existing = hashMap.get(file.sha256);
    if (existing) {
      existing.push(file);
    } else {
      hashMap.set(file.sha256, [file]);
    }
  }
  
  return Array.from(hashMap.values());
}

/**
 * Create a dedupe group from a set of similar files
 */
function createDedupeGroup(files: FileWithEmbedding[], groupIndex: number): DedupeGroup {
  // Select the file to keep using tie-breaker logic
  const keepFile = selectKeepFile(files);
  
  // Create duplicate matches for other files
  const duplicates: DuplicateMatch[] = files
    .filter((f) => f.id !== keepFile.id)
    .map((f) => {
      const similarity = calculateSimilarity(keepFile, f);
      const reason = explainMatch(keepFile, f, similarity);
      
      return {
        file: f,
        similarity,
        reason,
        isKept: false,
      };
    });
  
  // Calculate total size saved
  const totalSizeSaved = duplicates.reduce((sum, dup) => sum + dup.file.sizeBytes, 0);
  
  // Determine overall reason for grouping
  const allSameHash = files.every((f) => f.sha256 === keepFile.sha256);
  const reason = allSameHash ? 'Exact hash match' : 'High similarity';
  
  return {
    id: `group-${groupIndex}`,
    groupIndex,
    keepFile,
    duplicates,
    reason,
    totalSizeSaved,
  };
}

/**
 * Calculate similarity between two files
 * Uses embedding similarity if available, otherwise falls back to hash comparison
 */
function calculateSimilarity(file1: FileWithEmbedding, file2: FileWithEmbedding): number {
  // Exact hash match
  if (file1.sha256 === file2.sha256) {
    return 1.0;
  }
  
  // Embedding similarity
  if (file1.embedding && file2.embedding) {
    const { cosineSimilarity } = require('../similarity/cosine');
    return cosineSimilarity(file1.embedding, file2.embedding);
  }
  
  // Perceptual hash similarity (for images)
  if (file1.phash && file2.phash) {
    const { hammingDistance, hammingDistanceToSimilarity } = require('../hash/perceptual');
    const distance = hammingDistance(file1.phash, file2.phash);
    return hammingDistanceToSimilarity(distance);
  }
  
  return 0;
}

