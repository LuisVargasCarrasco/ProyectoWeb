import { useState, useEffect, memo } from 'react';
import {
  Container, Box, Tabs, Tab, AppBar, Toolbar,
  Typography, IconButton, Menu, MenuItem, Avatar
} from '@mui/material';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { BrowserRouter as Router, Routes, Route, Link as RouterLink } from 'react-router-dom';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import BikeMap from './components/Map/BikeMap';
import LoginForm from './components/Auth/LoginFrom';
import ReservationList from './components/Bikes/ReservationList';
import RideHistory from './components/Bikes/RideHistory';
import ActiveRides from './components/Bikes/ActiveRides';
import Profile from './components/Auth/Profile';
import UserProfile from './components/Auth/UserProfile';
import Home from './components/Home';
import { supabase } from './services/supabase';
import './App.css';

const theme = createTheme({
  palette: {
    primary: {
      main: '#2E7D32',
      light: '#4CAF50',
      dark: '#1B5E20',
    },
    secondary: {
      main: '#FF5722',
    },
    background: {
      default: '#F5F5F5',
      paper: '#FFFFFF',
    }
  },
  shape: {
    borderRadius: 12
  },
  typography: {
    fontFamily: 'Roboto, Arial, sans-serif',
    h5: {
      fontWeight: 600,
    },
    body1: {
      fontSize: '1rem',
    },
    body2: {
      fontSize: '0.875rem',
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
          borderRadius: 8,
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
          transition: 'transform 0.2s ease-in-out',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: '0 6px 12px rgba(0,0,0,0.15)',
          },
        },
      },
    },
    MuiTabs: {
      styleOverrides: {
        root: {
          borderBottom: 'none',
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
          minWidth: 120,
          color: 'black',
          '&.Mui-selected': {
            color: '#2E7D32',
          },
        },
      },
    },
  },
});

const Logo = memo(() => (
  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
    <Box
      component="img"
      src="/logobikeshare.jpg"
      alt="BikeShare Logo"
      sx={{
        height: 40,
        width: 'auto',
        objectFit: 'contain'
      }}
    />
    <Typography
      variant="h6"
      sx={{
        fontWeight: 600,
        display: 'flex',
        alignItems: 'center',
        color: 'black'
      }}
    >
      BikeShare
    </Typography>
  </Box>
));

function App() {
  const [session, setSession] = useState(null);
  const [tab, setTab] = useState(0);
  const [anchorEl, setAnchorEl] = useState(null);
  const [profilePicture, setProfilePicture] = useState(null);
  const open = Boolean(anchorEl);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        fetchProfilePicture(session.user.id);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        fetchProfilePicture(session.user.id);
      }
    });

    return () => subscription?.unsubscribe();
  }, []);

  const fetchProfilePicture = async (userId) => {
    const { data, error } = await supabase
      .from('user')
      .select('profile_picture')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error fetching profile picture:', error);
    } else {
      setProfilePicture(data.profile_picture);
    }
  };

  const handleMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    handleClose();
  };

  const handleTabChange = (event, newValue) => {
    setTab(newValue);
  };

  if (!session) {
    return (
      <ThemeProvider theme={theme}>
        <Box sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: '#2E7D32',
          backgroundImage: 'linear-gradient(135deg,rgb(74, 185, 79) 0%,rgb(72, 192, 80) 100%)',
        }}>
          <Container maxWidth="sm">
            <LoginForm />
          </Container>
        </Box>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <Router>
        <Box sx={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'auto'
        }}>
          <AppBar position="static" elevation={0} sx={{ bgcolor: 'white', color: 'black' }}>
            <Toolbar sx={{ minHeight: 64 }}>
              <Logo />
              <Tabs
                value={tab}
                onChange={handleTabChange}
                sx={{
                  ml: 4,
                  flex: 1,
                  '.MuiTab-root': {
                    color: 'black',
                    fontWeight: 'bold',
                    fontSize: '1rem',
                    minWidth: 100,
                  },
                  '.Mui-selected': {
                    color: '#5CCB5F',
                  },
                  '.MuiTabs-indicator': {
                    backgroundColor: '#5CCB5F',
                  },
                }}
                TabIndicatorProps={{
                  style: { height: 3 }
                }}
              >
                <Tab
                  label="Inicio"
                  component={RouterLink}
                  to="/Inicio"
                  sx={{
                    textTransform: 'none',
                  }}
                />
                <Tab
                  label="Mapa"
                  component={RouterLink}
                  to="/BikeMap"
                  sx={{
                    textTransform: 'none',
                  }}
                />
                <Tab
                  label="Mis Reservas"
                  component={RouterLink}
                  to="/ReservationList"
                  sx={{
                    textTransform: 'none',
                  }}
                />
                <Tab
                  label="Viajes Activos"
                  component={RouterLink}
                  to="/ActiveRides"
                  sx={{
                    textTransform: 'none',
                  }}
                />
                <Tab
                  label="Mi Perfil"
                  component={RouterLink}
                  to="/Profile"
                  sx={{
                    textTransform: 'none',
                  }}
                />
              </Tabs>
              <IconButton
                color="inherit"
                onClick={handleMenu}
                sx={{ ml: 2 }}
              >
                {profilePicture ? (
                  <Avatar src={profilePicture} sx={{ width: 32, height: 32 }} />
                ) : (
                  <AccountCircleIcon sx={{ color: 'black' }} />
                )}
              </IconButton>
              <Menu
                anchorEl={anchorEl}
                open={open}
                onClose={handleClose}
                anchorOrigin={{
                  vertical: 'bottom',
                  horizontal: 'right',
                }}
                transformOrigin={{
                  vertical: 'top',
                  horizontal: 'right',
                }}
              >
                <MenuItem onClick={() => setTab(4)}>Mi Perfil</MenuItem>
                <MenuItem onClick={handleLogout}>Cerrar Sesión</MenuItem>
              </Menu>
            </Toolbar>
          </AppBar>

          <Box sx={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            p: 3,
            bgcolor: 'background.default',
            overflow: 'auto'
          }}>
            <Routes>
              <Route path="/Inicio" element={<Home />} />
              <Route path="/BikeMap" element={<BikeMap />} />
              <Route path="/ReservationList" element={<ReservationList />} />
              <Route path="/ActiveRides" element={<ActiveRides />} />
              <Route path="/RideHistory" element={<RideHistory />} />
              <Route path="/Profile" element={<Profile />} />
              <Route path="/user-profile" element={<UserProfile />} />
              <Route path="*" element={<Home />} />
            </Routes>
          </Box>
        </Box>
      </Router>
    </ThemeProvider>
  );
}

export default App;