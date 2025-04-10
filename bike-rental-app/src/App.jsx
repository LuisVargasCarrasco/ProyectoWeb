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
          borderBottom: '1px solid rgba(0, 0, 0, 0.12)',
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
          minWidth: 120,
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
        color: 'white'
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
          backgroundImage: 'linear-gradient(135deg, #2E7D32 0%, #1B5E20 100%)',
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
          height: '100vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}>
          <AppBar position="static" elevation={0}>
            <Toolbar>
              <Box sx={{ flexGrow: 1 }}>
                <Logo />
              </Box>
              <IconButton
                color="inherit"
                onClick={handleMenu}
                sx={{ ml: 2 }}
              >
                {profilePicture ? (
                  <Avatar src={profilePicture} sx={{ width: 32, height: 32 }} />
                ) : (
                  <AccountCircleIcon />
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

          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center', // Centrar horizontalmente
              bgcolor: 'background.paper',
              borderBottom: 1,
              borderColor: 'divider',
              px: 2,
            }}
          >
            <Tabs
              value={tab}
              onChange={handleTabChange}
              sx={{
                borderBottom: 1,
                borderColor: 'divider',
                bgcolor: 'background.paper',
                px: 2,
                display: 'flex',
                justifyContent: 'center', // Centrar horizontalmente
                '& .MuiTabs-indicator': {
                  display: 'none', // Ocultar el indicador predeterminado
                },
              }}
            >
              <Tab
                label="Inicio"
                component={RouterLink}
                to="/Inicio"
                sx={{
                  textTransform: 'none',
                  fontWeight: 'bold',
                  color: tab === 0 ? '#2E7D32' : '#1B5E20', // Color del texto
                  bgcolor: tab === 0 ? '#E8F5E9' : 'transparent', // Fondo más claro para la pestaña activa
                  borderRadius: 1,
                  mx: 1,
                  px: 3,
                  py: 1,
                  '&:hover': {
                    bgcolor: '#F1F8E9',
                    color: '#1B5E20',
                  },
                }}
              />
              <Tab
                label="Mapa"
                component={RouterLink}
                to="/BikeMap"
                sx={{
                  textTransform: 'none',
                  fontWeight: 'bold',
                  color: tab === 1 ? '#2E7D32' : '#1B5E20',
                  bgcolor: tab === 1 ? '#E8F5E9' : 'transparent',
                  borderRadius: 1,
                  mx: 1,
                  px: 3,
                  py: 1,
                  '&:hover': {
                    bgcolor: '#F1F8E9',
                    color: '#1B5E20',
                  },
                }}
              />
              <Tab
                label="Mis Reservas"
                component={RouterLink}
                to="/ReservationList"
                sx={{
                  textTransform: 'none',
                  fontWeight: 'bold',
                  color: tab === 2 ? '#2E7D32' : '#1B5E20',
                  bgcolor: tab === 2 ? '#E8F5E9' : 'transparent',
                  borderRadius: 1,
                  mx: 1,
                  px: 3,
                  py: 1,
                  '&:hover': {
                    bgcolor: '#F1F8E9',
                    color: '#1B5E20',
                  },
                }}
              />
              <Tab
                label="Viajes Activos"
                component={RouterLink}
                to="/ActiveRides"
                sx={{
                  textTransform: 'none',
                  fontWeight: 'bold',
                  color: tab === 3 ? '#2E7D32' : '#1B5E20',
                  bgcolor: tab === 3 ? '#E8F5E9' : 'transparent',
                  borderRadius: 1,
                  mx: 1,
                  px: 3,
                  py: 1,
                  '&:hover': {
                    bgcolor: '#F1F8E9',
                    color: '#1B5E20',
                  },
                }}
              />
              <Tab
                label="Mi Perfil"
                component={RouterLink}
                to="/Profile"
                sx={{
                  textTransform: 'none',
                  fontWeight: 'bold',
                  color: tab === 4 ? '#2E7D32' : '#1B5E20',
                  bgcolor: tab === 4 ? '#E8F5E9' : 'transparent',
                  borderRadius: 1,
                  mx: 1,
                  px: 3,
                  py: 1,
                  '&:hover': {
                    bgcolor: '#F1F8E9',
                    color: '#1B5E20',
                  },
                }}
              />
            </Tabs>
          </Box>

          <Box sx={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            p: 3,
            bgcolor: 'background.default',
            overflow: 'hidden'
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