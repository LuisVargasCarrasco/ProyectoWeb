import { useState, useEffect } from 'react'
import { 
  Box, Card, CardContent, Typography, Button, CircularProgress, Alert,
  Dialog, DialogTitle, DialogContent, DialogActions, Select, MenuItem, 
  FormControl, InputLabel 
} from '@mui/material'
import { supabase } from '../../services/supabase'
import InfoIcon from '@mui/icons-material/Info'
import DirectionsBikeIcon from '@mui/icons-material/DirectionsBike'
import LocationOnIcon from '@mui/icons-material/LocationOn'
import TimerIcon from '@mui/icons-material/Timer'

const ActiveRides = () => {
  const [activeTrips, setActiveTrips] = useState([])
  const [locations, setLocations] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [returnDialog, setReturnDialog] = useState(false)
  const [selectedLocation, setSelectedLocation] = useState('')
  const [selectedTrip, setSelectedTrip] = useState(null)

  useEffect(() => {
    fetchActiveTrips()
    fetchLocations()

    const subscription = supabase
      .channel('trip-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'trip' }, 
        () => fetchActiveTrips()
      )
      .subscribe()

    return () => subscription.unsubscribe()
  }, [])

  const fetchLocations = async () => {
    try {
      const { data, error } = await supabase
        .from('location')
        .select('id, location_name')

      if (error) throw error
      setLocations(data || [])
    } catch (err) {
      console.error('Error fetching locations:', err)
      setError('Error al cargar las ubicaciones')
    }
  }

  const fetchActiveTrips = async () => {
    try {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      
      const { data, error } = await supabase
        .from('trip')
        .select(`
          *,
          bike:bike_id (*),
          start_location:start_location_id (location_name)
        `)
        .eq('user_id', user.id)
        .eq('status', 'active')

      if (error) throw error
      setActiveTrips(data || [])
    } catch (err) {
      console.error('Error fetching active trips:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleReturnBike = async () => {
    if (!selectedLocation || !selectedTrip) return

    try {
      const { error: tripError } = await supabase
        .from('trip')
        .update({
          end_location_id: selectedLocation,
          end_time: new Date().toISOString(),
          status: 'completed'
        })
        .eq('id', selectedTrip.id)

      if (tripError) throw tripError

      const { error: bikeError } = await supabase
        .from('bike')
        .update({
          status: 'available',
          current_location_id: selectedLocation
        })
        .eq('id', selectedTrip.bike.id)

      if (bikeError) throw bikeError

      setReturnDialog(false)
      setSelectedLocation('')
      setSelectedTrip(null)
      alert('Viaje finalizado correctamente')
      fetchActiveTrips()
    } catch (err) {
      console.error('Error returning bike:', err)
      setError('Error al finalizar el viaje')
    }
  }

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="100%">
        <CircularProgress />
      </Box>
    )
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        {error}
      </Alert>
    )
  }

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Typography variant="h5" sx={{ mb: 3, fontWeight: 600 }}>
        Viajes Activos
      </Typography>
      
      {activeTrips.length === 0 ? (
        <Card 
          sx={{ 
            p: 4, 
            textAlign: 'center',
            bgcolor: 'primary.light',
            color: 'white',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 2
          }}
        >
          <InfoIcon sx={{ fontSize: 48 }} />
          <Box>
            <Typography variant="h6" sx={{ mb: 1 }}>
              No tienes viajes activos
            </Typography>
            <Typography variant="body1">
              Puedes iniciar un viaje desbloqueando una bicicleta reservada
            </Typography>
          </Box>
        </Card>
      ) : (
        <Box sx={{ flex: 1, overflow: 'auto' }}>
          {activeTrips.map(trip => (
            <Card 
              key={trip.id} 
              sx={{ 
                mb: 2,
                '&:hover': {
                  boxShadow: 6
                },
                transition: 'box-shadow 0.3s'
              }}
            >
              <CardContent>
                <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <DirectionsBikeIcon color="primary" />
                  Bicicleta #{trip.bike?.id}
                </Typography>
                <Box sx={{ my: 2 }}>
                  <Typography 
                    variant="body1" 
                    sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: 1,
                      color: 'text.secondary',
                      mb: 1
                    }}
                  >
                    <LocationOnIcon />
                    Inicio: {trip.start_location?.location_name}
                  </Typography>
                  <Typography 
                    variant="body1" 
                    sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: 1,
                      color: 'text.secondary'
                    }}
                  >
                    <TimerIcon />
                    Inicio: {new Date(trip.start_time).toLocaleString()}
                  </Typography>
                </Box>
                <Button 
                  variant="contained"
                  fullWidth
                  onClick={() => {
                    setSelectedTrip(trip)
                    setReturnDialog(true)
                  }}
                  startIcon={<LocationOnIcon />}
                  sx={{ 
                    mt: 1,
                    py: 1
                  }}
                >
                  Finalizar Viaje
                </Button>
              </CardContent>
            </Card>
          ))}
        </Box>
      )}

      <Dialog 
        open={returnDialog} 
        onClose={() => {
          setReturnDialog(false)
          setSelectedLocation('')
          setSelectedTrip(null)
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Finalizar Viaje</DialogTitle>
        <DialogContent>
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel>Estación de devolución</InputLabel>
            <Select
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
              label="Estación de devolución"
            >
              {locations.map((location) => (
                <MenuItem key={location.id} value={location.id}>
                  {location.location_name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => {
              setReturnDialog(false)
              setSelectedLocation('')
              setSelectedTrip(null)
            }}
          >
            Cancelar
          </Button>
          <Button 
            onClick={handleReturnBike}
            variant="contained"
            disabled={!selectedLocation}
          >
            Confirmar Devolución
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default ActiveRides