import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { 
  Container, 
  Typography, 
  Tabs, 
  Tab, 
  Box, 
  Paper, 
  CircularProgress,
  Button,
  Menu,
  MenuItem,
  Alert,
  Fade,
  Divider,
  Tooltip
} from '@mui/material';
import { 
  Download as DownloadIcon, 
  Architecture as ArchitectureIcon,
  KeyboardArrowDown as ArrowDownIcon,
  ZoomIn as ZoomInIcon,
  ZoomOut as ZoomOutIcon,
  ZoomOutMap as FitToScreenIcon
} from '@mui/icons-material';
import mermaid from 'mermaid';
import { diagramDefinitions } from '../utils/diagramDefinitions';
import { exportAsImage, exportAsPDF, exportSVGAsImage, getDiagramTitle, sanitizeFilename } from '../utils/exportUtils';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index, ...other }) => {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`diagram-tabpanel-${index}`}
      aria-labelledby={`diagram-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
};

const UMLDiagrams: React.FC = () => {
  const [value, setValue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exportAnchorEl, setExportAnchorEl] = useState<null | HTMLElement>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  
  const diagramRefs = useRef<(HTMLDivElement | null)[]>([]);
  const diagramContainerRefs = useRef<(HTMLDivElement | null)[]>([]);
  const diagrams = useMemo(() => diagramDefinitions, []);

  const renderDiagram = useCallback(async (index: number) => {
    const element = diagramRefs.current[index];
    if (!element || !diagrams[index]) {
      console.log(`Cannot render diagram ${index}: element or diagram missing`);
      return;
    }

    try {
      // Clear previous content safely
      while (element.firstChild) {
        element.removeChild(element.firstChild);
      }
      
      // Clean up the mermaid text - remove \r\n and ensure proper line endings
      const cleanMermaidText = diagrams[index].mermaid
        .replace(/\r\n/g, '\n')
        .replace(/\r/g, '\n')
        .trim();
      
      // Use a simple, valid CSS selector-friendly ID
      const diagramId = `mermaid_diagram_${index}_${Date.now()}`;
      console.log(`Rendering diagram ${index}: ${diagrams[index].title}`);
      console.log(`Mermaid text preview:`, cleanMermaidText.substring(0, 100) + '...');
      
      const { svg } = await mermaid.render(diagramId, cleanMermaidText);
      
      // Create a wrapper div and set innerHTML
      const wrapper = document.createElement('div');
      wrapper.innerHTML = svg;
      element.appendChild(wrapper);
      
      console.log(`Successfully rendered diagram ${index}`);
    } catch (err) {
      console.error(`Error rendering diagram ${index}:`, err);
      
      // Create error message element safely
      const errorDiv = document.createElement('div');
      errorDiv.style.cssText = 'padding: 20px; text-align: center; color: #666;';
      errorDiv.innerHTML = `
        <strong>Error rendering diagram</strong><br>
        ${err instanceof Error ? err.message : 'Unknown error'}<br>
        <small>Check console for details</small>
      `;
      element.appendChild(errorDiv);
    }
  }, [diagrams]);

  const initializeMermaid = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Initializing mermaid...');
      console.log('Available diagrams:', diagrams.length);

      // Clean up any existing mermaid generated elements
      const existingElements = document.querySelectorAll('[id^="mermaid_diagram_"]');
      existingElements.forEach(el => {
        if (el.parentNode) {
          el.parentNode.removeChild(el);
        }
      });

      // Initialize mermaid with safe configuration
      mermaid.initialize({
        startOnLoad: false,
        theme: 'neutral',
        securityLevel: 'loose',
        deterministicIds: false,
        fontFamily: 'system-ui, -apple-system, sans-serif',
        fontSize: 14,
        flowchart: {
          useMaxWidth: false,
          htmlLabels: true,
          curve: 'basis',
          padding: 20,
        },
        sequence: {
          useMaxWidth: false,
          diagramMarginX: 50,
          diagramMarginY: 10,
          boxTextMargin: 5,
          noteMargin: 10,
          messageMargin: 35,
        },
      });

      console.log('Mermaid initialized successfully');
      
      // Wait for refs to be ready and render first diagram
      setTimeout(async () => {
        if (diagramRefs.current[value]) {
          console.log(`Rendering initial diagram: ${value}`);
          await renderDiagram(value);
        } else {
          console.log(`Diagram ref not ready for index: ${value}`);
        }
        setLoading(false);
      }, 200);
      
    } catch (error) {
      console.error('Error initializing mermaid:', error);
      setError('Failed to load diagrams');
      setLoading(false);
    }
  }, [value, renderDiagram, diagrams.length]);

  useEffect(() => {
    // Initialize refs array and mermaid
    diagramRefs.current = new Array(diagrams.length).fill(null);
    diagramContainerRefs.current = new Array(diagrams.length).fill(null);
    
    // Initialize mermaid after a short delay to ensure refs are ready
    const timer = setTimeout(() => {
      initializeMermaid();
    }, 100);
    
    return () => {
      clearTimeout(timer);
      // Clean up any existing diagram elements
      diagramRefs.current.forEach(ref => {
        if (ref) {
          while (ref.firstChild) {
            ref.removeChild(ref.firstChild);
          }
        }
      });
    };
  }, [diagrams.length, initializeMermaid]);

  useEffect(() => {
    // Render diagram when tab changes (after initial load)
    if (diagramRefs.current[value] && !loading) {
      const element = diagramRefs.current[value];
      // Only render if the element is empty
      if (element && element.children.length === 0) {
        renderDiagram(value);
      }
    }
  }, [value, loading, renderDiagram]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
    // Reset pan offset when changing tabs
    setPanOffset({ x: 0, y: 0 });
    
    // The useEffect will handle rendering the new diagram
  };

  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(3, prev + 0.25));
  };

  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(0.25, prev - 0.25));
  };

  const handleResetView = () => {
    setZoomLevel(1);
    setPanOffset({ x: 0, y: 0 });
  };

  const handleMouseDown = (event: React.MouseEvent) => {
    if (event.button === 0) { // Left mouse button
      setIsDragging(true);
      setDragStart({ x: event.clientX - panOffset.x, y: event.clientY - panOffset.y });
      event.preventDefault();
    }
  };

  const handleMouseMove = (event: React.MouseEvent) => {
    if (isDragging) {
      setPanOffset({
        x: event.clientX - dragStart.x,
        y: event.clientY - dragStart.y
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleWheel = (event: React.WheelEvent) => {
    event.preventDefault();
    const delta = event.deltaY > 0 ? -0.1 : 0.1;
    setZoomLevel(prev => Math.max(0.25, Math.min(3, prev + delta)));
  };

  const handleExportClick = (event: React.MouseEvent<HTMLElement>) => {
    setExportAnchorEl(event.currentTarget);
  };

  const handleExportClose = () => {
    setExportAnchorEl(null);
  };

  const handleExportAs = async (format: 'png' | 'jpeg' | 'pdf' | 'svg-png') => {
    try {
      setIsExporting(true);
      setError(null); // Clear any previous errors
      
      const currentDiagramRef = diagramRefs.current[value];
      
      if (!currentDiagramRef) {
        throw new Error('Diagram not found');
      }

      // Check if diagram is actually rendered
      const svgElement = currentDiagramRef.querySelector('svg');
      if (!svgElement) {
        console.error('No SVG found in diagram container');
        throw new Error('Diagram not yet rendered. Please wait for the diagram to load before exporting.');
      }

      console.log('Exporting diagram:', { format, value, diagramTitle: diagrams[value]?.title });

      const filename = sanitizeFilename(getDiagramTitle(diagrams, value));
      
      if (format === 'pdf') {
        await exportAsPDF(currentDiagramRef, { filename });
      } else if (format === 'svg-png') {
        await exportSVGAsImage(currentDiagramRef, { filename, format: 'png' });
      } else {
        await exportAsImage(currentDiagramRef, { filename, format });
      }
      
      console.log('Export completed successfully');
    } catch (error) {
      console.error('Export failed:', error);
      setError(error instanceof Error ? error.message : 'Failed to export diagram');
    } finally {
      setIsExporting(false);
      handleExportClose();
    }
  };

  const exportMenuOpen = Boolean(exportAnchorEl);

  return (
    <Container maxWidth="xl" sx={{ mt: 2, mb: 4 }}>
      <Paper 
        elevation={0} 
        sx={{ 
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 2,
          overflow: 'hidden'
        }}
      >
        {/* Header */}
        <Box sx={{ 
          px: 3, 
          py: 2, 
          backgroundColor: 'grey.50',
          borderBottom: '1px solid',
          borderColor: 'divider',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <ArchitectureIcon sx={{ color: 'primary.main' }} />
            <Typography 
              variant="h5" 
              sx={{ 
                fontWeight: 600,
                color: 'text.primary'
              }}
            >
              System Architecture Diagrams
          </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {/* Zoom Controls */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mr: 2 }}>
              <Tooltip title="Zoom out (or scroll down)">
                <Button
                  variant="outlined"
                  size="small"
                  onClick={handleZoomOut}
                  disabled={zoomLevel <= 0.25}
                  sx={{ minWidth: 'auto', p: 0.5, borderColor: 'divider' }}
                >
                  <ZoomOutIcon fontSize="small" />
                </Button>
              </Tooltip>
              
              <Typography variant="caption" sx={{ mx: 1, minWidth: '50px', textAlign: 'center' }}>
                {Math.round(zoomLevel * 100)}%
              </Typography>
              
              <Tooltip title="Zoom in (or scroll up)">
                <Button
                  variant="outlined"
                  size="small"
                  onClick={handleZoomIn}
                  disabled={zoomLevel >= 3}
                  sx={{ minWidth: 'auto', p: 0.5, borderColor: 'divider' }}
                >
                  <ZoomInIcon fontSize="small" />
                </Button>
              </Tooltip>
              
              <Tooltip title="Reset view (100% zoom, center position)">
                <Button
                  variant="outlined"
                  size="small"
                  onClick={handleResetView}
                  sx={{ minWidth: 'auto', p: 0.5, borderColor: 'divider', ml: 0.5 }}
                >
                  <FitToScreenIcon fontSize="small" />
                </Button>
              </Tooltip>
            </Box>

            <Tooltip title="Export current diagram">
              <Button
                variant="outlined"
                size="small"
                startIcon={<DownloadIcon />}
                endIcon={<ArrowDownIcon />}
                onClick={handleExportClick}
                disabled={loading || isExporting}
                sx={{ 
                  borderColor: 'divider',
                  color: 'text.secondary',
                  '&:hover': {
                    borderColor: 'primary.main',
                    color: 'primary.main'
                  }
                }}
              >
                {isExporting ? 'Exporting...' : 'Export'}
              </Button>
            </Tooltip>
          </Box>

          <Menu
            anchorEl={exportAnchorEl}
            open={exportMenuOpen}
            onClose={handleExportClose}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            transformOrigin={{ vertical: 'top', horizontal: 'right' }}
          >
            <MenuItem onClick={() => handleExportAs('svg-png')}>
              <Box>
                <Typography variant="body2">Ultra High Quality PNG</Typography>
                <Typography variant="caption" color="text.secondary">5x scale, perfect clarity, 5-15MB</Typography>
              </Box>
            </MenuItem>
            <MenuItem onClick={() => handleExportAs('png')}>
              <Box>
                <Typography variant="body2">High Quality PNG</Typography>
                <Typography variant="caption" color="text.secondary">4x scale, crisp text, 3-8MB</Typography>
              </Box>
            </MenuItem>
            <MenuItem onClick={() => handleExportAs('jpeg')}>
              <Box>
                <Typography variant="body2">JPEG</Typography>
                <Typography variant="caption" color="text.secondary">Compressed, good for sharing, &lt;2MB</Typography>
              </Box>
            </MenuItem>
            <Divider />
            <MenuItem onClick={() => handleExportAs('pdf')}>
              <Box>
                <Typography variant="body2">PDF (Print Quality)</Typography>
                <Typography variant="caption" color="text.secondary">300 DPI, crystal clear, &lt;5MB</Typography>
              </Box>
            </MenuItem>
          </Menu>
        </Box>

        {/* Error Alert */}
        {error && (
          <Fade in={Boolean(error)}>
            <Alert 
              severity="error" 
              onClose={() => setError(null)}
              sx={{ m: 2 }}
            >
              {error}
            </Alert>
          </Fade>
        )}

        {/* Tabs */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs 
            value={value} 
            onChange={handleTabChange}
            variant="scrollable"
            scrollButtons="auto"
            sx={{
              '& .MuiTab-root': {
                minHeight: 48,
                textTransform: 'none',
                fontSize: '0.875rem',
                fontWeight: 500
              }
            }}
          >
            {diagrams.map((diagram, index) => (
              <Tab 
                key={index} 
                label={diagram.title}
                id={`diagram-tab-${index}`}
                aria-controls={`diagram-tabpanel-${index}`}
              />
            ))}
          </Tabs>
        </Box>

        {/* Diagram Content */}
        <Box sx={{ position: 'relative' }}>
          {diagrams.map((diagram, index) => (
            <TabPanel key={index} value={value} index={index}>
              <Box sx={{ px: 3 }}>
                <Typography 
                  variant="h6" 
                  gutterBottom
                  sx={{ fontWeight: 600, color: 'text.primary' }}
                >
                    {diagram.title}
                  </Typography>
                <Typography 
                  variant="body2" 
                  color="text.secondary" 
                  sx={{ mb: 3, lineHeight: 1.6 }}
                >
                    {diagram.description}
                </Typography>
                
                {/* Debug info - remove in production */}
                {process.env.NODE_ENV === 'development' && (
                  <Typography variant="caption" color="text.disabled" sx={{ mb: 2, display: 'block' }}>
                    Debug: Diagram {index}, Mermaid length: {diagram.mermaid?.length || 0} chars
                  </Typography>
                )}
                
                {/* User instructions */}
                <Typography variant="caption" color="text.secondary" sx={{ mb: 2, display: 'block' }}>
                  💡 Use mouse wheel to zoom • Click and drag to pan • Use controls above to reset view
                </Typography>
                
                <Box
                  ref={(el: HTMLDivElement | null) => {
                    diagramContainerRefs.current[index] = el;
                  }}
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={handleMouseUp}
                  onWheel={handleWheel}
                  sx={{
                    width: '100%',
                    minHeight: '600px',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: loading ? 'center' : 'flex-start',
                    backgroundColor: '#fafafa',
                    borderRadius: 1,
                    border: '1px solid',
                    borderColor: 'divider',
                    p: 2,
                    overflow: 'hidden',
                    cursor: isDragging ? 'grabbing' : 'grab',
                    userSelect: 'none',
                    position: 'relative'
                  }}
                >
                  {loading && value === index ? (
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                      <CircularProgress size={40} />
                      <Typography variant="body2" color="text.secondary">
                        Loading diagram...
                      </Typography>
                    </Box>
                  ) : (
                    <Box
                      ref={(el: HTMLDivElement | null) => {
                        diagramRefs.current[index] = el;
                      }}
                      sx={{
                        width: '100%',
                        display: 'flex',
                        justifyContent: 'center',
                        transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoomLevel})`,
                        transformOrigin: 'center center',
                        transition: isDragging ? 'none' : 'transform 0.2s ease-in-out',
                        pointerEvents: 'none', // Prevent interference with drag
                        '& svg': { 
                          width: '100%',
                          minWidth: '1000px',
                          height: 'auto',
                          backgroundColor: '#fff',
                          borderRadius: 1,
                          padding: '20px',
                          boxSizing: 'border-box',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                          pointerEvents: 'auto' // Re-enable for SVG interactions
                        },
                        '& .node rect, & .node circle, & .node ellipse, & .node polygon': {
                          fontSize: '14px !important'
                        },
                        '& text': {
                          fontSize: '13px !important',
                          fontFamily: 'inherit !important'
                        },
                        '& .actor': {
                          fontSize: '14px !important'
                        },
                        '& .messageText': {
                          fontSize: '12px !important'
                        }
                      }}
                    />
                  )}
                </Box>
            </Box>
            </TabPanel>
          ))}
        </Box>
      </Paper>
    </Container>
  );
};

export default UMLDiagrams;
