import type { FileMetadata } from '@ai-cleanup/types';

/**
 * Extended file metadata with resolution and modified time
 */
export interface FileMetadataExtended extends FileMetadata {
  resolution?: { width: number; height: number };
  modifiedTime?: Date | string | number;
}

/**
 * Select which file to keep from a group of duplicates
 *
 * Priority (tie-breaker logic):
 * 1. SHA-256 hash (prefer files with hash if others don't have it)
 * 2. Higher resolution (for images) - width * height
 * 3. Newer modified time (if available)
 * 4. Larger file size (higher quality)
 * 5. First in list (stable sort by filename)
 *
 * @param files - Array of duplicate files
 * @returns File to keep
 */
export function selectKeepFile<T extends FileMetadata | FileMetadataExtended>(files: T[]): T {
  if (files.length === 0) {
    throw new Error('Cannot select keep file from empty array');
  }

  if (files.length === 1) {
    return files[0]!;
  }

  // Sort by priority rules
  const sorted = [...files].sort((a, b) => {
    // 1. Prefer files with SHA-256 hash (more reliable identification)
    const aHasHash = !!(a as any).sha256 && (a as any).sha256.length > 0;
    const bHasHash = !!(b as any).sha256 && (b as any).sha256.length > 0;
    if (aHasHash !== bHasHash) {
      return bHasHash ? 1 : -1;
    }

    // 2. Prefer higher resolution (for images)
    const aExt = a as FileMetadataExtended;
    const bExt = b as FileMetadataExtended;
    if (aExt.resolution && bExt.resolution) {
      const aResolution = aExt.resolution.width * aExt.resolution.height;
      const bResolution = bExt.resolution.width * bExt.resolution.height;
      if (aResolution !== bResolution) {
        return bResolution - aResolution;
      }
    } else if (aExt.resolution && !bExt.resolution) {
      return -1; // Prefer file with resolution info
    } else if (!aExt.resolution && bExt.resolution) {
      return 1;
    }

    // 3. Prefer newer modified time (if available)
    if (aExt.modifiedTime && bExt.modifiedTime) {
      const aTime =
        typeof aExt.modifiedTime === 'string'
          ? new Date(aExt.modifiedTime).getTime()
          : typeof aExt.modifiedTime === 'number'
            ? aExt.modifiedTime
            : aExt.modifiedTime.getTime();
      const bTime =
        typeof bExt.modifiedTime === 'string'
          ? new Date(bExt.modifiedTime).getTime()
          : typeof bExt.modifiedTime === 'number'
            ? bExt.modifiedTime
            : bExt.modifiedTime.getTime();
      if (aTime !== bTime) {
        return bTime - aTime; // Newer is better
      }
    } else if (aExt.modifiedTime && !bExt.modifiedTime) {
      return -1; // Prefer file with modified time
    } else if (!aExt.modifiedTime && bExt.modifiedTime) {
      return 1;
    }

    // 4. Prefer larger file size (likely higher quality)
    if (a.sizeBytes !== b.sizeBytes) {
      return b.sizeBytes - a.sizeBytes;
    }

    // 5. If all else is equal, prefer by filename (stable sort)
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
