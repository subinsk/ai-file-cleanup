import type { FileMetadata } from '@ai-cleanup/types';
import { SIMILARITY_THRESHOLDS } from '@ai-cleanup/types';

/**
 * Explain why two files are considered duplicates
 * 
 * @param file1 - First file
 * @param file2 - Second file
 * @param similarity - Similarity score (0-1)
 * @returns Human-readable explanation
 */
export function explainMatch(
  file1: FileMetadata,
  file2: FileMetadata,
  similarity: number
): string {
  // Exact hash match
  if (file1.sha256 === file2.sha256) {
    return 'Exact match (identical files)';
  }
  
  // Perceptual hash match
  if (file1.phash && file2.phash && file1.phash === file2.phash) {
    return 'Visually identical';
  }
  
  // High similarity
  if (similarity >= SIMILARITY_THRESHOLDS.EXACT_MATCH) {
    const percentage = Math.round(similarity * 100);
    if (file1.mimeType.startsWith('image/')) {
      return `Visual similarity: ${percentage}%`;
    } else if (file1.mimeType === 'application/pdf' || file1.mimeType === 'text/plain') {
      return `Text similarity: ${percentage}%`;
    } else {
      return `Similarity: ${percentage}%`;
    }
  }
  
  if (similarity >= SIMILARITY_THRESHOLDS.HIGH_SIMILARITY) {
    const percentage = Math.round(similarity * 100);
    return `Likely duplicate (${percentage}% similar)`;
  }
  
  if (similarity >= SIMILARITY_THRESHOLDS.MEDIUM_SIMILARITY) {
    const percentage = Math.round(similarity * 100);
    return `Possible duplicate (${percentage}% similar)`;
  }
  
  return 'Low similarity';
}

/**
 * Generate a detailed report for a duplicate group
 * 
 * @param files - Files in the group
 * @param keepFile - File selected to keep
 * @returns Detailed report
 */
export function generateGroupReport(files: FileMetadata[], keepFile: FileMetadata): string {
  const lines: string[] = [];
  
  lines.push(`Found ${files.length} duplicate files`);
  lines.push(`Keeping: ${keepFile.fileName} (${formatBytes(keepFile.sizeBytes)})`);
  lines.push('');
  lines.push('Duplicates:');
  
  for (const file of files) {
    if (file.id !== keepFile.id) {
      lines.push(`  - ${file.fileName} (${formatBytes(file.sizeBytes)})`);
    }
  }
  
  const totalSize = files
    .filter((f) => f.id !== keepFile.id)
    .reduce((sum, f) => sum + f.sizeBytes, 0);
  
  lines.push('');
  lines.push(`Total space saved: ${formatBytes(totalSize)}`);
  
  return lines.join('\n');
}

/**
 * Format bytes to human-readable string
 */
function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

