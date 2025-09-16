import React, { useState, useEffect } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  Tabs,
  Tab,
  createTheme,
  ThemeProvider,
  CssBaseline,
  Container
} from '@mui/material';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import Dashboard from './components/Dashboard';
import NewScanPage from './components/NewScanPage';
import ScanDetailPage from './components/ScanDetailPage';
import UMLDiagrams from './components/UMDiagrams';


// Create modern theme
const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2',
      light: '#42a5f5',
      dark: '#1565c0',
    },
    secondary: {
      main: '#dc004e',
      light: '#ff5983',
      dark: '#9a0036',
    },
    background: {
      default: '#f8fafc',
      paper: '#ffffff',
    },
    text: {
      primary: '#1a202c',
      secondary: '#4a5568',
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h4: {
      fontWeight: 600,
      letterSpacing: '-0.025em',
    },
    h5: {
      fontWeight: 600,
      letterSpacing: '-0.025em',
    },
    h6: {
      fontWeight: 600,
      letterSpacing: '-0.025em',
    },
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiAppBar: {
      styleOverrides: {
        root: {
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
          backdropFilter: 'blur(8px)',
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          color: '#1a202c',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
          border: '1px solid rgba(0, 0, 0, 0.05)',
        },
        elevation1: {
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 500,
          borderRadius: 8,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          border: '1px solid rgba(0, 0, 0, 0.05)',
        },
      },
    },
  },
});

// Navigation component
const Navigation: React.FC = () => {
  const location = useLocation();
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (location.pathname === '/uml-diagrams') {
      setValue(1);
    } else {
      setValue(0);
    }
  }, [location]);

  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
  };

  return (
    <AppBar position="sticky" elevation={0}>
      <Container maxWidth="xl">
        <Toolbar disableGutters>
          <Typography 
            variant="h5" 
            component="div" 
            sx={{ 
              flexGrow: 1,
              fontWeight: 700,
              background: 'linear-gradient(45deg, #1976d2, #42a5f5)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            AI File Management
          </Typography>
          <Tabs 
            value={value} 
            onChange={handleChange} 
            textColor="inherit"
            sx={{
              '& .MuiTab-root': {
                minHeight: 48,
                fontWeight: 500,
                '&.Mui-selected': {
                  color: '#1976d2',
                },
              },
              '& .MuiTabs-indicator': {
                backgroundColor: '#1976d2',
                height: 3,
                borderRadius: '3px 3px 0 0',
              },
            }}
          >
            <Tab 
              label="Dashboard" 
              component={Link} 
              to="/" 
            />
            <Tab 
              label="UML Diagrams" 
              component={Link} 
              to="/uml-diagrams" 
            />
          </Tabs>
        </Toolbar>
      </Container>
    </AppBar>
  );
};

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Box sx={{ 
          flexGrow: 1,
          minHeight: '100vh',
          background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
        }}>
          <Navigation />
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/scan/new" element={<NewScanPage />} />
            <Route path="/scan/:scanId" element={<ScanDetailPage />} />
            <Route path="/uml-diagrams" element={<UMLDiagrams />} />
            <Route path="*" element={
              <Box sx={{ p: 4, textAlign: 'center' }}>
                <Typography variant="h4">404 - Page Not Found</Typography>
                <Typography variant="body1" sx={{ mt: 2 }}>
                  The page you're looking for doesn't exist.
                </Typography>
                <Typography variant="body2" sx={{ mt: 1, color: 'text.secondary' }}>
                  Current URL: {window.location.pathname}
                </Typography>
              </Box>
            } />
          </Routes>
        </Box>
      </Router>
    </ThemeProvider>
  );
}

export default App;
