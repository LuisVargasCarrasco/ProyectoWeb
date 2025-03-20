import { useState, useEffect } from 'react'
import { Container, Box, Paper, Tabs, Tab, AppBar, Toolbar, Typography, Button } from '@mui/material'
import BikeMap from './components/Map/BikeMap'
import LoginForm from './components/Auth/LoginFrom'
import ReservationList from './components/Bikes/ReservationList'
import RideHistory from './components/Bikes/RideHistory'
import './App.css'
import { supabase } from './services/supabase'

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
      <Container maxWidth="sm" sx={{ mt: 8 }}>
        <Paper elevation={3} sx={{ p: 4, borderRadius: 2 }}>
          <Typography variant="h4" component="h1" gutterBottom align="center">
            Bike Rental
          </Typography>
          <Typography variant="subtitle1" gutterBottom align="center" sx={{ mb: 4 }}>
            Inicia sesión para continuar
          </Typography>
          <LoginForm />
        </Paper>
      </Container>
    )
  }

  return (
    <Box sx={{ 
      display: 'flex', 
      flexDirection: 'column', 
      minHeight: '100vh' 
    }}>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
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
        bgcolor: 'background.default'
      }}>
        <Paper sx={{ 
          flex: 1, 
          display: 'flex', 
          flexDirection: 'column',
          borderRadius: 2,
          overflow: 'hidden'
        }}>
          <Tabs 
            value={tab} 
            onChange={(e, newValue) => setTab(newValue)}
            sx={{ 
              borderBottom: 1, 
              borderColor: 'divider',
              bgcolor: 'background.paper'
            }}
          >
            <Tab label="Mapa" />
            <Tab label="Mis Reservas" />
            <Tab label="Historial" />
          </Tabs>
          <Box sx={{ 
            flex: 1,
            overflow: 'auto',
            p: 2
          }}>
            {tab === 0 && <BikeMap />}
            {tab === 1 && <ReservationList />}
            {tab === 2 && <RideHistory />}
          </Box>
        </Paper>
      </Box>
    </Box>
  )
}

export default App