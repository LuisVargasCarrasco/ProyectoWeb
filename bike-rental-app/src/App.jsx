import { useState, useEffect, memo } from 'react'
import { 
  Container, Box, Tabs, Tab, AppBar, Toolbar, 
  Typography, IconButton, Menu, MenuItem 
} from '@mui/material'
import { ThemeProvider, createTheme } from '@mui/material/styles'
import AccountCircleIcon from '@mui/icons-material/AccountCircle'
import DirectionsBikeIcon from '@mui/icons-material/DirectionsBike'
import BikeMap from './components/Map/BikeMap'
import LoginForm from './components/Auth/LoginFrom'
import ReservationList from './components/Bikes/ReservationList'
import RideHistory from './components/Bikes/RideHistory'
import ActiveRides from './components/Bikes/ActiveRides'
import UserProfile from './components/Auth/UserProfile'
import { supabase } from './services/supabase'
import './App.css'

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
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600
        }
      }
    },
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
          transition: 'transform 0.2s ease-in-out',
          '&:hover': {
            transform: 'translateY(-2px)'
          }
        }
      }
    }
  }
})

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
        alignItems: 'center'
      }}
    >
      BikeShare
    </Typography>
  </Box>
))

const NavigationTabs = memo(({ value, onChange }) => (
  <Tabs 
    value={value} 
    onChange={onChange}
    sx={{ 
      borderBottom: 1, 
      borderColor: 'divider',
      bgcolor: 'background.paper',
      px: 2
    }}
  >
    <Tab label="Mapa" />
    <Tab label="Mis Reservas" />
    <Tab label="Viajes Activos" />
    <Tab label="Historial" />
    <Tab label="Mi Perfil" sx={{ ml: 'auto' }} />
  </Tabs>
))

const UserMenu = memo(({ anchorEl, open, onClose, onProfile, onLogout }) => (
  <Menu
    anchorEl={anchorEl}
    open={open}
    onClose={onClose}
    anchorOrigin={{
      vertical: 'bottom',
      horizontal: 'right',
    }}
    transformOrigin={{
      vertical: 'top',
      horizontal: 'right',
    }}
  >
    <MenuItem onClick={onProfile}>
      Mi Perfil
    </MenuItem>
    <MenuItem onClick={onLogout}>
      Cerrar Sesión
    </MenuItem>
  </Menu>
))

function App() {
  const [session, setSession] = useState(null)
  const [tab, setTab] = useState(0)
  const [anchorEl, setAnchorEl] = useState(null)
  const open = Boolean(anchorEl)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => subscription?.unsubscribe()
  }, [])

  const handleMenu = (event) => {
    setAnchorEl(event.currentTarget)
  }

  const handleClose = () => {
    setAnchorEl(null)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    handleClose()
  }

  const handleProfileClick = () => {
    setTab(4)
    handleClose()
  }

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
    )
  }

  return (
    <ThemeProvider theme={theme}>
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
              <AccountCircleIcon />
            </IconButton>
            <UserMenu 
              anchorEl={anchorEl}
              open={open}
              onClose={handleClose}
              onProfile={handleProfileClick}
              onLogout={handleLogout}
            />
          </Toolbar>
        </AppBar>

        <Box sx={{ 
          flex: 1,
          display: 'flex', 
          flexDirection: 'column',
          p: 3,
          bgcolor: 'background.default',
          overflow: 'hidden'
        }}>
          <Box sx={{ 
            flex: 1, 
            display: 'flex', 
            flexDirection: 'column',
            bgcolor: 'background.paper',
            borderRadius: 2,
            overflow: 'hidden',
            boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
          }}>
            <NavigationTabs 
              value={tab} 
              onChange={(e, newValue) => setTab(newValue)}
            />
            <Box sx={{ 
              flex: 1,
              overflow: 'auto',
              p: 2
            }}>
              {tab === 0 && <BikeMap />}
              {tab === 1 && <ReservationList />}
              {tab === 2 && <ActiveRides />}
              {tab === 3 && <RideHistory />}
              {tab === 4 && <UserProfile />}
            </Box>
          </Box>
        </Box>
      </Box>
    </ThemeProvider>
  )
}

export default App