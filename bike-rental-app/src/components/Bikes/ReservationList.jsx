import { useState, useEffect } from 'react'
import { 
  Box, Card, CardContent, Typography, Button, CircularProgress, Alert,
  Dialog, DialogTitle, DialogContent, DialogActions, Select, MenuItem, FormControl, InputLabel 
} from '@mui/material'
import { supabase } from '../../services/supabase'

const ReservationList = () => {
  const [reservedBikes, setReservedBikes] = useState([])
  const [locations, setLocations] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [returnDialog, setReturnDialog] = useState(false)
  const [selectedLocation, setSelectedLocation] = useState('')
  const [selectedBikeId, setSelectedBikeId] = useState(null)

  useEffect(() => {
    fetchReservedBikes()
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

  const fetchReservedBikes = async () => {
    try {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      
      const { data, error } = await supabase
        .from('bike')
        .select(`
          *,
          location:current_location_id (
            location_name,
            address
          )
        `)
        .eq('status', 'reserved')

      if (error) throw error

      console.log('Reserved bikes:', data)
      setReservedBikes(data || [])
    } catch (err) {
      console.error('Error fetching reservations:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleUnlock = async (bikeId) => {
    try {
      const { error } = await supabase
        .from('bike')
        .update({ status: 'in_use' })
        .eq('id', bikeId)

      if (error) throw error
      
      fetchReservedBikes()
    } catch (err) {
      console.error('Error unlocking bike:', err)
      setError('Error al desbloquear la bicicleta')
    }
  }

  const handleReturn = async () => {
    if (!selectedLocation || !selectedBikeId) return

    try {
      const { error } = await supabase
        .from('bike')
        .update({ 
          status: 'available',
          current_location_id: selectedLocation 
        })
        .eq('id', selectedBikeId)

      if (error) throw error

      setReturnDialog(false)
      setSelectedLocation('')
      setSelectedBikeId(null)
      fetchReservedBikes()
    } catch (err) {
      console.error('Error returning bike:', err)
      setError('Error al devolver la bicicleta')
    }
  }

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" m={4}>
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
    <Box>
      <Typography variant="h5" sx={{ mb: 2 }}>
        Mis Bicicletas en Uso
      </Typography>
      
      {reservedBikes.map(bike => (
  <Card key={bike.id} sx={{ mb: 2 }}>
    <CardContent>
      <Typography variant="h6">Bicicleta #{bike.id}</Typography>
      <Typography variant="body1" gutterBottom>
        Ubicación actual: {bike.location?.location_name || 'En uso'}
      </Typography>
      <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
        <Button 
          variant="contained"
          color="primary"
          onClick={() => handleUnlock(bike.id)}
        >
          Desbloquear
        </Button>
        <Button 
          variant="outlined"
          color="secondary"
          onClick={() => {
            setSelectedBikeId(bike.id)
            setReturnDialog(true)
          }}
        >
          Devolver Bicicleta
        </Button>
      </Box>
    </CardContent>
  </Card>
))}

      <Dialog 
        open={returnDialog} 
        onClose={() => {
          setReturnDialog(false)
          setSelectedLocation('')
          setSelectedBikeId(null)
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
            setSelectedBikeId(null)
          }}>
            Cancelar
          </Button>
          <Button 
            onClick={handleReturn}
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

export default ReservationList