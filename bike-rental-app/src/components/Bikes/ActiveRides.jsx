import { useState, useEffect } from 'react'
import { 
  Box, Card, CardContent, Typography, Button, CircularProgress, Alert,
  Dialog, DialogTitle, DialogContent, DialogActions, Select, MenuItem, FormControl, InputLabel 
} from '@mui/material'
import { supabase } from '../../services/supabase'

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
      // Update trip status and end location
      const { error: tripError } = await supabase
        .from('trip')
        .update({
          end_location_id: selectedLocation,
          end_time: new Date().toISOString(),
          status: 'completed'
        })
        .eq('id', selectedTrip.id)

      if (tripError) throw tripError

      // Update bike status and location
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
      fetchActiveTrips()
      alert('Bicicleta devuelta correctamente')
    } catch (err) {
      console.error('Error returning bike:', err)
      setError('Error al devolver la bicicleta')
    }
  }

  if (loading) return <Box display="flex" justifyContent="center" m={4}><CircularProgress /></Box>
  if (error) return <Alert severity="error" sx={{ m: 2 }}>{error}</Alert>

  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 2 }}>
        Viajes Activos
      </Typography>
      
      {activeTrips.length === 0 ? (
        <Alert severity="info">No tienes viajes activos</Alert>
      ) : (
        activeTrips.map(trip => (
          <Card key={trip.id} sx={{ mb: 2 }}>
            <CardContent>
              <Typography variant="h6">
                Bicicleta #{trip.bike?.id}
              </Typography>
              <Typography variant="body1" gutterBottom>
                Inicio: {trip.start_location?.location_name}
              </Typography>
              <Button 
                variant="contained"
                color="primary"
                onClick={() => {
                  setSelectedTrip(trip)
                  setReturnDialog(true)
                }}
              >
                Finalizar Viaje
              </Button>
            </CardContent>
          </Card>
        ))
      )}

      <Dialog 
        open={returnDialog} 
        onClose={() => {
          setReturnDialog(false)
          setSelectedLocation('')
          setSelectedTrip(null)
        }}
      >
        <DialogTitle>Devolver Bicicleta</DialogTitle>
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
          <Button onClick={() => {
            setReturnDialog(false)
            setSelectedLocation('')
            setSelectedTrip(null)
          }}>
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