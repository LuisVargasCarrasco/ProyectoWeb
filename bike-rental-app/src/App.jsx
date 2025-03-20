import { useState, useEffect } from 'react'
import { Container, Box, Tabs, Tab, AppBar, Toolbar, Typography, Button } from '@mui/material'
import BikeMap from './components/Map/BikeMap'
import LoginForm from './components/Auth/LoginFrom'
import ReservationList from './components/Bikes/ReservationList'
import RideHistory from './components/Bikes/RideHistory'
import ActiveRides from './components/Bikes/ActiveRides'
import './App.css'
import { supabase } from './services/supabase'
import { ThemeProvider, createTheme } from '@mui/material/styles'

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
});

function App() {
  const [session, setSession] = useState(null)
  const [tab, setTab] = useState(0)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
    })

    supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
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
            <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 600 }}>
              BikeShare
            </Typography>
            <Button color="inherit" onClick={handleLogout}>
              Cerrar Sesión
            </Button>
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
            borderRadius: 3,
            overflow: 'hidden',
            boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
          }}>
            <Tabs 
              value={tab} 
              onChange={(e, newValue) => setTab(newValue)}
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
            </Tabs>
            <Box sx={{ 
              flex: 1,
              overflow: 'auto',
              p: 2
            }}>
              {tab === 0 && <BikeMap />}
              {tab === 1 && <ReservationList />}
              {tab === 2 && <ActiveRides />}
              {tab === 3 && <RideHistory />}
            </Box>
          </Box>
        </Box>
      </Box>
    </ThemeProvider>
  )
}

export default App