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

    const subscription = supabase
      .channel('bike-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'bike' }, 
        () => fetchReservedBikes()
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

  const fetchReservedBikes = async () => {
    try {
      setLoading(true)
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
      const { data: { user } } = await supabase.auth.getUser()
      
      const { data: bike } = await supabase
        .from('bike')
        .select('current_location_id')
        .eq('id', bikeId)
        .single()

      const { error: tripError } = await supabase
        .from('trip')
        .insert({
          bike_id: bikeId,
          user_id: user.id,
          start_location_id: bike.current_location_id,
          status: 'active'
        })

      if (tripError) throw tripError

      const { error: bikeError } = await supabase
        .from('bike')
        .update({ status: 'in_use' })
        .eq('id', bikeId)

      if (bikeError) throw bikeError
      
      alert('¡Bicicleta desbloqueada! Disfruta tu viaje')
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
      alert('Bicicleta devuelta correctamente')
      fetchReservedBikes()
    } catch (err) {
      console.error('Error returning bike:', err)
      setError('Error al devolver la bicicleta')
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
        Mis Reservas Activas
      </Typography>
      
      {reservedBikes.length === 0 ? (
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
              No tienes reservas activas
            </Typography>
            <Typography variant="body1">
              Puedes reservar una bicicleta desde el mapa de estaciones
            </Typography>
          </Box>
        </Card>
      ) : (
        <Box sx={{ flex: 1, overflow: 'auto' }}>
          {reservedBikes.map(bike => (
            <Card 
              key={bike.id} 
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
                  Bicicleta #{bike.id}
                </Typography>
                <Typography 
                  variant="body1" 
                  sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 1,
                    color: 'text.secondary',
                    my: 1
                  }}
                >
                  <LocationOnIcon />
                  {bike.location?.location_name || 'Ubicación no disponible'}
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                  <Button 
                    variant="contained"
                    onClick={() => handleUnlock(bike.id)}
                    startIcon={<DirectionsBikeIcon />}
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
                    startIcon={<LocationOnIcon />}
                  >
                    Devolver
                  </Button>
                </Box>
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
          setSelectedBikeId(null)
        }}
        maxWidth="sm"
        fullWidth
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
          <Button 
            onClick={() => {
              setReturnDialog(false)
              setSelectedLocation('')
              setSelectedBikeId(null)
            }}
          >
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