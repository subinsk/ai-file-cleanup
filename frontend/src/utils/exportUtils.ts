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
    scale = 4
  } = options;

  try {
    console.log('Export element:', element);
    console.log('Element HTML:', element.innerHTML.substring(0, 200));
    
    // Find the SVG element within the container
    const svgElement = element.querySelector('svg');
    console.log('Found SVG:', svgElement);
    
    if (!svgElement) {
      console.error('No SVG found. Element contents:', element.innerHTML);
      throw new Error('No SVG found in the provided element');
    }

    // Get the SVG's actual content dimensions (bounding box)
    const svgRect = svgElement.getBoundingClientRect();
    const bbox = svgElement.getBBox();
    
    console.log('SVG BBox:', bbox);
    console.log('SVG ClientRect:', svgRect);
    
    // Use the actual content dimensions, not the container dimensions
    const actualWidth = bbox.width || svgRect.width;
    const actualHeight = bbox.height || svgRect.height;
    
    // Add small padding around the content
    const padding = 20;
    const exportWidth = actualWidth + (padding * 2);
    const exportHeight = actualHeight + (padding * 2);

    // Create a temporary container sized exactly to the content
    const tempContainer = document.createElement('div');
    tempContainer.style.position = 'absolute';
    tempContainer.style.top = '-9999px';
    tempContainer.style.left = '-9999px';
    tempContainer.style.background = '#ffffff';
    tempContainer.style.padding = `${padding}px`;
    tempContainer.style.width = `${actualWidth}px`;
    tempContainer.style.height = `${actualHeight}px`;
    tempContainer.style.overflow = 'visible';
    
    // Clone the SVG and set exact dimensions
    const clonedSvg = svgElement.cloneNode(true) as SVGElement;
    clonedSvg.style.display = 'block';
    clonedSvg.style.width = `${actualWidth}px`;
    clonedSvg.style.height = `${actualHeight}px`;
    clonedSvg.style.maxWidth = 'none';
    clonedSvg.style.maxHeight = 'none';
    
    // If there's a viewBox offset, adjust it to show only the content
    if (bbox.x !== 0 || bbox.y !== 0) {
      clonedSvg.setAttribute('viewBox', `${bbox.x} ${bbox.y} ${bbox.width} ${bbox.height}`);
    }
    
    tempContainer.appendChild(clonedSvg);
    document.body.appendChild(tempContainer);

    // Configure html2canvas to capture exact dimensions with high quality
    const canvas = await html2canvas(tempContainer, {
      useCORS: true,
      allowTaint: true,
      background: '#ffffff',
      logging: false,
      width: exportWidth * scale,
      height: exportHeight * scale,
    });

    // Clean up temporary element
    document.body.removeChild(tempContainer);

    // Create download link
    const link = document.createElement('a');
    link.download = `${filename}.${format}`;
    
    if (format === 'jpeg') {
      link.href = canvas.toDataURL('image/jpeg', quality);
    } else {
      link.href = canvas.toDataURL('image/png', quality);
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
 * Export PDF using html2canvas fallback
 */
const exportPDFFallback = async (element: HTMLElement, filename: string) => {
  console.log('PDF: Using html2canvas fallback method');
  
  try {
    // Use html2canvas with high quality settings
    const canvas = await html2canvas(element, {
      useCORS: true,
      allowTaint: true,
      background: '#ffffff',
      logging: false,
      width: element.scrollWidth * 3, // Higher scale for better quality
      height: element.scrollHeight * 3,
    });

    console.log('PDF Fallback: Canvas created', { width: canvas.width, height: canvas.height });

    const imgData = canvas.toDataURL('image/png', 1.0); // Maximum quality
    
    // Calculate PDF dimensions with high scale
    const mmPerPx = 0.264583; // 96 DPI to mm conversion
    const canvasWidthMM = canvas.width * mmPerPx / 3; // Account for scale
    const canvasHeightMM = canvas.height * mmPerPx / 3;
    
    console.log('PDF Fallback: PDF dimensions (mm)', { canvasWidthMM, canvasHeightMM });
    
    const pdf = new jsPDF({
      orientation: canvasWidthMM > canvasHeightMM ? 'landscape' : 'portrait',
      unit: 'mm',
      format: [canvasWidthMM, canvasHeightMM]
    });

    pdf.addImage(imgData, 'PNG', 0, 0, canvasWidthMM, canvasHeightMM);
    pdf.save(`${filename}.pdf`);
    
    console.log('PDF Fallback: Successfully saved');
  } catch (error) {
    console.error('PDF Fallback: Error in html2canvas fallback:', error);
    throw error;
  }
};

/**
 * Export SVG as optimized PDF with proper sizing
 */
export const exportAsPDF = async (
  element: HTMLElement,
  options: ExportOptions = {}
): Promise<void> => {
  const {
    filename = 'diagram'
  } = options;

  // Try direct html2canvas approach first (more reliable)
  try {
    console.log('PDF: Trying direct html2canvas approach');
    await exportPDFFallback(element, filename);
    console.log('PDF: Direct approach succeeded');
    return;
  } catch (directError) {
    console.log('PDF: Direct approach failed, trying SVG method:', directError);
  }

  try {
    console.log('PDF Export element:', element);
    console.log('PDF Element HTML:', element.innerHTML.substring(0, 200));
    
    // Find the SVG element within the container
    const svgElement = element.querySelector('svg');
    console.log('PDF Found SVG:', svgElement);
    
    if (!svgElement) {
      console.error('PDF: No SVG found. Element contents:', element.innerHTML);
      throw new Error('No SVG found in the provided element');
    }

    // Get the actual content dimensions using bounding box
    let bbox, rect;
    
    try {
      bbox = svgElement.getBBox();
      console.log('PDF SVG BBox:', bbox);
    } catch (error) {
      console.warn('PDF: Could not get SVG bounding box:', error);
      bbox = { x: 0, y: 0, width: 0, height: 0 };
    }
    
    try {
      rect = svgElement.getBoundingClientRect();
      console.log('PDF SVG ClientRect:', rect);
    } catch (error) {
      console.warn('PDF: Could not get client rect:', error);
      rect = { width: 800, height: 600 }; // fallback dimensions
    }
    
    // Use bounding box for actual content size, fallback to client rect
    const svgWidth = (bbox.width > 0 ? bbox.width : rect.width) || 800;
    const svgHeight = (bbox.height > 0 ? bbox.height : rect.height) || 600;
    
    console.log('PDF Content dimensions:', { svgWidth, svgHeight });
    
    if (!svgWidth || !svgHeight || svgWidth <= 0 || svgHeight <= 0) {
      console.error('PDF: Invalid dimensions, using fallback');
      throw new Error(`Invalid SVG dimensions: ${svgWidth}x${svgHeight}`);
    }

    // Convert SVG to string and create data URL
    const svgData = new XMLSerializer().serializeToString(svgElement);
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const svgUrl = URL.createObjectURL(svgBlob);

    // Create image element to get natural SVG dimensions
    const img = new Image();
    console.log('PDF: Loading SVG as image...');
    
    await new Promise<void>((resolve, reject) => {
      img.onload = () => {
        console.log('PDF: Image loaded successfully', { 
          naturalWidth: img.naturalWidth, 
          naturalHeight: img.naturalHeight 
        });
        resolve();
      };
      img.onerror = (error) => {
        console.error('PDF: Failed to load SVG as image:', error);
        reject(new Error('Failed to load SVG as image'));
      };
      
      // Set a timeout to avoid hanging
      setTimeout(() => {
        reject(new Error('Timeout loading SVG as image'));
      }, 10000);
      
      img.src = svgUrl;
    });

    // Use the image's natural dimensions or fallback to calculated
    const naturalWidth = img.naturalWidth || svgWidth;
    const naturalHeight = img.naturalHeight || svgHeight;
    
    // Calculate high-quality canvas size (300 DPI for print quality)
    const dpi = 96; // Standard screen DPI
    const pdfDpi = 300; // High-quality print DPI
    const scaleFactor = pdfDpi / dpi;
    
    const canvasWidth = Math.round(naturalWidth * scaleFactor);
    const canvasHeight = Math.round(naturalHeight * scaleFactor);

    // Create canvas with optimal size
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      throw new Error('Could not get canvas context');
    }

    canvas.width = canvasWidth;
    canvas.height = canvasHeight;
    
    // Fill white background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);
    
    // Draw image at proper scale
    ctx.drawImage(img, 0, 0, canvasWidth, canvasHeight);
    
    // Clean up
    URL.revokeObjectURL(svgUrl);

    // Convert to high-quality PNG
    const imgData = canvas.toDataURL('image/png', 1.0); // Maximum quality
    
    // Calculate PDF dimensions (convert px to mm at 300 DPI)
    const mmPerPx = 25.4 / 300; // mm per pixel at 300 DPI
    const pdfWidthMM = canvasWidth * mmPerPx;
    const pdfHeightMM = canvasHeight * mmPerPx;
    
    // Create PDF with exact diagram size (no extra margins)
    const pdf = new jsPDF({
      orientation: pdfWidthMM > pdfHeightMM ? 'landscape' : 'portrait',
      unit: 'mm',
      format: [pdfWidthMM, pdfHeightMM]
    });

    // Add image to fill entire PDF page
    pdf.addImage(
      imgData,
      'PNG',
      0, // no margin
      0, // no margin
      pdfWidthMM, // full width
      pdfHeightMM // full height
    );

    // Save PDF
    pdf.save(`${filename}.pdf`);
  } catch (error) {
    console.error('Error exporting as PDF:', error);
    console.log('PDF: Attempting fallback method...');
    
    try {
      await exportPDFFallback(element, filename);
      console.log('PDF: Fallback method succeeded');
    } catch (fallbackError) {
      console.error('PDF: Fallback method also failed:', fallbackError);
      throw new Error('Failed to export diagram as PDF');
    }
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
 * Export SVG directly as optimized image (best quality/size ratio)
 */
export const exportSVGAsImage = async (
  element: HTMLElement,
  options: ExportOptions = {}
): Promise<void> => {
  const {
    filename = 'diagram',
    format = 'png',
    quality = 1.0,
    scale = 5
  } = options;

  try {
    console.log('SVG Export element:', element);
    console.log('SVG Element HTML:', element.innerHTML.substring(0, 200));
    
    const svgElement = element.querySelector('svg');
    console.log('SVG Found SVG:', svgElement);
    
    if (!svgElement) {
      console.error('SVG: No SVG found. Element contents:', element.innerHTML);
      throw new Error('No SVG found in the provided element');
    }

    // Get the actual content dimensions using bounding box
    const bbox = svgElement.getBBox();
    console.log('SVG BBox for direct export:', bbox);
    
    // Clone SVG and set it to show only the content area
    const clonedSvg = svgElement.cloneNode(true) as SVGElement;
    
    // Set viewBox to crop to actual content
    if (bbox.width > 0 && bbox.height > 0) {
      clonedSvg.setAttribute('viewBox', `${bbox.x} ${bbox.y} ${bbox.width} ${bbox.height}`);
      clonedSvg.setAttribute('width', bbox.width.toString());
      clonedSvg.setAttribute('height', bbox.height.toString());
    }
    
    // Get SVG data and clean it
    const svgData = new XMLSerializer().serializeToString(clonedSvg);
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const svgUrl = URL.createObjectURL(svgBlob);

    // Create image from SVG
    const img = new Image();
    
    await new Promise<void>((resolve, reject) => {
      img.onload = () => {
        console.log('SVG: Image loaded successfully', { 
          naturalWidth: img.naturalWidth, 
          naturalHeight: img.naturalHeight 
        });
        resolve();
      };
      img.onerror = (error) => {
        console.error('SVG: Failed to load SVG as image:', error);
        URL.revokeObjectURL(svgUrl);
        reject(new Error('Failed to load SVG as image'));
      };
      
      // Set a timeout to avoid hanging
      setTimeout(() => {
        URL.revokeObjectURL(svgUrl);
        reject(new Error('Timeout loading SVG as image'));
      }, 10000);
      
      console.log('SVG: Loading SVG as image...');
      img.src = svgUrl;
    });

    // Create canvas with optimal resolution
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      URL.revokeObjectURL(svgUrl);
      throw new Error('Could not get canvas context');
    }

    // Set canvas size with reasonable scaling for quality
    canvas.width = Math.round(img.naturalWidth * scale);
    canvas.height = Math.round(img.naturalHeight * scale);
    
    // Enable high-quality rendering
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    
    // Fill white background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw the image scaled
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    
    // Export with compression
    const link = document.createElement('a');
    link.download = `${filename}.${format}`;
    
    if (format === 'jpeg') {
      link.href = canvas.toDataURL('image/jpeg', quality);
    } else {
      link.href = canvas.toDataURL('image/png', quality);
    }
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Cleanup
    URL.revokeObjectURL(svgUrl);
  } catch (error) {
    console.error('Error exporting SVG as image:', error);
    console.log('SVG: Attempting html2canvas fallback...');
    
    try {
      // Fallback to regular image export
      await exportAsImage(element, { filename, format, quality, scale });
      console.log('SVG: Fallback method succeeded');
    } catch (fallbackError) {
      console.error('SVG: Fallback method also failed:', fallbackError);
      throw new Error('Failed to export diagram as image');
    }
  }
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
