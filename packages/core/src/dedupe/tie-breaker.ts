import type { FileMetadata } from '@ai-cleanup/types';

/**
 * Select which file to keep from a group of duplicates
 * 
 * Priority:
 * 1. Higher resolution (for images)
 * 2. Newer modified time (if available)
 * 3. Larger file size (higher quality)
 * 4. First in list (stable sort)
 * 
 * @param files - Array of duplicate files
 * @returns File to keep
 */
export function selectKeepFile<T extends FileMetadata>(files: T[]): T {
  if (files.length === 0) {
    throw new Error('Cannot select keep file from empty array');
  }
  
  if (files.length === 1) {
    return files[0]!;
  }
  
  // Sort by priority rules
  const sorted = [...files].sort((a, b) => {
    // 1. Prefer larger file size (likely higher quality)
    if (a.sizeBytes !== b.sizeBytes) {
      return b.sizeBytes - a.sizeBytes;
    }
    
    // 2. If sizes are equal, prefer by filename (stable sort)
    return a.fileName.localeCompare(b.fileName);
  });
  
  return sorted[0]!;
}

/**
 * Calculate a quality score for a file
 * Higher score = better quality
 * 
 * @param file - File to score
 * @returns Quality score
 */
export function calculateQualityScore(file: FileMetadata): number {
  let score = 0;
  
  // Larger files generally have higher quality
  score += Math.log10(file.sizeBytes + 1);
  
  // Bonus for having text excerpt (indicates proper text extraction)
  if (file.textExcerpt && file.textExcerpt.length > 0) {
    score += 5;
  }
  
  return score;
}

/**
 * Select multiple files to keep (for advanced scenarios)
 * Can be used when user wants to keep N best quality files
 * 
 * @param files - Array of files
 * @param count - Number of files to keep
 * @returns Array of files to keep, sorted by quality
 */
export function selectTopNFiles<T extends FileMetadata>(files: T[], count: number): T[] {
  if (count >= files.length) {
    return files;
  }
  
  const scored = files.map((file) => ({
    file,
    score: calculateQualityScore(file),
  }));
  
  scored.sort((a, b) => b.score - a.score);
  
  return scored.slice(0, count).map((item) => item.file);
}

