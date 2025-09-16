import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

export interface ExportOptions {
  filename?: string;
  format?: 'png' | 'jpeg' | 'pdf';
  quality?: number;
  scale?: number;
}

/**
 * Export an HTML element as an image (PNG or JPEG)
 */
export const exportAsImage = async (
  element: HTMLElement,
  options: ExportOptions = {}
): Promise<void> => {
  const {
    filename = 'diagram',
    format = 'png',
    quality = 1.0,
    scale = 2
  } = options;

  try {
    // Configure html2canvas options for better quality
    const canvas = await html2canvas(element, {
      useCORS: true,
      allowTaint: true,
      background: '#ffffff',
      logging: false,
      width: element.offsetWidth * scale,
      height: element.offsetHeight * scale,
    });

    // Create download link
    const link = document.createElement('a');
    link.download = `${filename}.${format}`;
    
    if (format === 'jpeg') {
      link.href = canvas.toDataURL('image/jpeg', quality);
    } else {
      link.href = canvas.toDataURL('image/png');
    }
    
    // Trigger download
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (error) {
    console.error('Error exporting as image:', error);
    throw new Error('Failed to export diagram as image');
  }
};

/**
 * Export an HTML element as a PDF
 */
export const exportAsPDF = async (
  element: HTMLElement,
  options: ExportOptions = {}
): Promise<void> => {
  const {
    filename = 'diagram',
    scale = 2
  } = options;

  try {
    // First convert to canvas
    const canvas = await html2canvas(element, {
      useCORS: true,
      allowTaint: true,
      background: '#ffffff',
      logging: false,
      width: element.offsetWidth * scale,
      height: element.offsetHeight * scale,
    });

    const imgData = canvas.toDataURL('image/png');
    
    // Calculate PDF dimensions
    const imgWidth = canvas.width;
    const imgHeight = canvas.height;
    
    // Create PDF with appropriate size
    // Using A4 as base, but adjust if image is larger
    const pdfWidth = 210; // A4 width in mm
    const pdfHeight = 297; // A4 height in mm
    
    const ratio = Math.min(pdfWidth / (imgWidth * 0.264583), pdfHeight / (imgHeight * 0.264583));
    const finalWidth = imgWidth * 0.264583 * ratio; // Convert px to mm
    const finalHeight = imgHeight * 0.264583 * ratio;
    
    const pdf = new jsPDF({
      orientation: finalWidth > finalHeight ? 'landscape' : 'portrait',
      unit: 'mm',
      format: [Math.max(finalWidth, finalHeight), Math.min(finalWidth, finalHeight)]
    });

    // Add image to PDF
    pdf.addImage(
      imgData,
      'PNG',
      10, // x offset
      10, // y offset
      finalWidth - 20, // width with margins
      finalHeight - 20 // height with margins
    );

    // Save PDF
    pdf.save(`${filename}.pdf`);
  } catch (error) {
    console.error('Error exporting as PDF:', error);
    throw new Error('Failed to export diagram as PDF');
  }
};

/**
 * Get the diagram title from the current tab
 */
export const getDiagramTitle = (diagrams: any[], currentIndex: number): string => {
  if (diagrams[currentIndex]) {
    return diagrams[currentIndex].title.toLowerCase().replace(/\s+/g, '-');
  }
  return 'diagram';
};

/**
 * Sanitize filename for download
 */
export const sanitizeFilename = (filename: string): string => {
  return filename
    .replace(/[^a-z0-9]/gi, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase();
};
