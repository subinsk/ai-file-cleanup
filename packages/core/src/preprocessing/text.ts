import pdf from 'pdf-parse';

/**
 * Clean and normalize text
 * - Trim whitespace
 * - Normalize unicode
 * - Remove excessive whitespace
 * 
 * @param text - Input text
 * @returns Cleaned text
 */
export function cleanText(text: string): string {
  return text
    .normalize('NFKC') // Normalize unicode
    .replace(/\s+/g, ' ') // Replace multiple spaces with single space
    .trim();
}

/**
 * Extract text from PDF buffer
 * @param buffer - PDF file buffer
 * @param maxPages - Maximum pages to extract (default: all)
 * @returns Promise resolving to extracted text
 */
export async function extractPdfText(
  buffer: Buffer,
  maxPages?: number
): Promise<string> {
  try {
    const data = await pdf(buffer, {
      max: maxPages,
      pagerender: undefined, // Skip rendering, text only
    });
    
    return cleanText(data.text);
  } catch (error) {
    // If PDF parsing fails, return empty string
    // This can happen with image-only PDFs or encrypted PDFs
    console.warn('PDF text extraction failed:', error);
    return '';
  }
}

/**
 * Extract excerpt from text (first N characters)
 * @param text - Input text
 * @param maxLength - Maximum length (default 500)
 * @returns Text excerpt
 */
export function extractTextExcerpt(text: string, maxLength: number = 500): string {
  const cleaned = cleanText(text);
  if (cleaned.length <= maxLength) {
    return cleaned;
  }
  return cleaned.substring(0, maxLength) + '...';
}

/**
 * Read text file from buffer
 * @param buffer - Text file buffer
 * @param encoding - Text encoding (default 'utf-8')
 * @returns Decoded text
 */
export function readTextFile(buffer: Buffer, encoding: BufferEncoding = 'utf-8'): string {
  try {
    return buffer.toString(encoding);
  } catch (error) {
    throw new Error(`Failed to read text file: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

