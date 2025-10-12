import { createHash } from 'crypto';
import { Readable } from 'stream';

/**
 * Calculate SHA-256 hash from a Buffer
 * @param buffer - Input buffer
 * @returns Hexadecimal hash string
 */
export function sha256FromBuffer(buffer: Buffer): string {
  const hash = createHash('sha256');
  hash.update(buffer);
  return hash.digest('hex');
}

/**
 * Calculate SHA-256 hash from a stream
 * @param stream - Input readable stream
 * @returns Promise resolving to hexadecimal hash string
 */
export async function sha256FromStream(stream: Readable): Promise<string> {
  return new Promise((resolve, reject) => {
    const hash = createHash('sha256');
    
    stream.on('data', (chunk) => {
      hash.update(chunk);
    });
    
    stream.on('end', () => {
      resolve(hash.digest('hex'));
    });
    
    stream.on('error', (error) => {
      reject(error);
    });
  });
}

/**
 * Calculate SHA-256 hash from a string
 * @param text - Input string
 * @returns Hexadecimal hash string
 */
export function sha256FromString(text: string): string {
  const hash = createHash('sha256');
  hash.update(text, 'utf8');
  return hash.digest('hex');
}

