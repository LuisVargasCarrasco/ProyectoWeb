import { useState, useEffect } from 'react'
import { 
  Box, Card, CardContent, Typography, Button, CircularProgress, Alert,
  Dialog, DialogTitle, DialogContent, DialogActions, Select, MenuItem, 
  FormControl, InputLabel, Paper, Avatar, Chip 
} from '@mui/material'
import { supabase } from '../../services/supabase'
import InfoIcon from '@mui/icons-material/Info'
import DirectionsBikeIcon from '@mui/icons-material/DirectionsBike'
import LocationOnIcon from '@mui/icons-material/LocationOn'
import TimerIcon from '@mui/icons-material/Timer'

const TRIP_STATUS = {
  RESERVED: 'reserved',
  ACTIVE: 'active',
  COMPLETED: 'completed'
}

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
  
      const now = new Date().toISOString()
  
      // First create the trip
      const { error: tripError } = await supabase
        .from('trip')
        .insert({
          bike_id: bikeId,
          user_id: user.id,
          start_location_id: bike.current_location_id,
          start_time: now,
          status: TRIP_STATUS.ACTIVE
        })
  
      if (tripError) throw tripError
  
      // Update bike status but keep the current_location_id
      const { error: bikeError } = await supabase
        .from('bike')
        .update({ 
          status: 'in_use'
          // Removed current_location_id: null
        })
        .eq('id', bikeId)
  
      if (bikeError) throw bikeError
      
      alert('¡Bicicleta desbloqueada! Disfruta tu viaje')
      await fetchReservedBikes()
    } catch (err) {
      console.error('Error unlocking bike:', err)
      setError('Error al desbloquear la bicicleta: ' + err.message)
    }
  }
  
  const handleReturn = async () => {
    if (!selectedLocation || !selectedBikeId) return

    try {
      const now = new Date().toISOString()

      // Update trip status and end time
      const { error: tripError } = await supabase
        .from('trip')
        .update({ 
          status: TRIP_STATUS.COMPLETED,
          end_time: now,
          end_location_id: selectedLocation
        })
        .eq('bike_id', selectedBikeId)
        .eq('status', TRIP_STATUS.ACTIVE)

      if (tripError) throw tripError

      // Update bike status and location
      const { error: bikeError } = await supabase
        .from('bike')
        .update({ 
          status: 'available',
          current_location_id: selectedLocation 
        })
        .eq('id', selectedBikeId)

      if (bikeError) throw bikeError

      setReturnDialog(false)
      setSelectedLocation('')
      setSelectedBikeId(null)
      await fetchReservedBikes()

      alert('¡Bicicleta devuelta correctamente!')
    } catch (err) {
      console.error('Error returning bike:', err)
      setError('Error al devolver la bicicleta: ' + err.message)
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
      <Paper 
        elevation={0} 
        sx={{ 
          p: 2, 
          mb: 3, 
          bgcolor: 'primary.main', 
          color: 'white',
          borderRadius: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar sx={{ bgcolor: 'white' }}>
            <DirectionsBikeIcon color="primary" />
          </Avatar>
          <Typography variant="h5" sx={{ fontWeight: 600 }}>
            Mis Reservas
          </Typography>
        </Box>
        <Chip 
          icon={<DirectionsBikeIcon />}
          label={`${reservedBikes.length} ${reservedBikes.length === 1 ? 'reserva' : 'reservas'}`}
          sx={{ 
            bgcolor: 'white', 
            color: 'primary.main',
            '& .MuiChip-icon': { color: 'primary.main' }
          }}
        />
      </Paper>
      
      {reservedBikes.length === 0 ? (
        <Card 
          elevation={0}
          sx={{ 
            p: 4, 
            textAlign: 'center',
            bgcolor: 'primary.light',
            color: 'white',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 2,
            borderRadius: 2,
            border: '1px dashed rgba(255,255,255,0.5)'
          }}
        >
          <InfoIcon sx={{ fontSize: 48 }} />
          <Box>
            <Typography variant="h6" sx={{ mb: 1, fontWeight: 500 }}>
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
              elevation={0}
              sx={{ 
                mb: 2,
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 2,
                '&:hover': {
                  borderColor: 'primary.main',
                  bgcolor: 'primary.50',
                },
                transition: 'all 0.3s ease'
              }}
            >
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                  <Avatar sx={{ bgcolor: 'primary.light' }}>
                    <DirectionsBikeIcon />
                  </Avatar>
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      Bicicleta #{bike.id}
                      <Chip
                        label={`Modelo ${bike.model_id}`}
                        size="small"
                        sx={{ ml: 1 }}
                        color="primary"
                        variant="outlined"
                      />
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, mt: 0.5 }}>
                      {bike.location && (
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1
                          }}
                        >
                          <LocationOnIcon fontSize="small" />
                          Ubicación: {bike.location.location_name}
                        </Typography>
                      )}
                    </Box>
                  </Box>
                </Box>

                <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                  <Button 
                    variant="contained"
                    fullWidth
                    onClick={() => handleUnlock(bike.id)}
                    startIcon={<DirectionsBikeIcon />}
                  >
                    Desbloquear
                  </Button>
                  <Button 
                    variant="outlined"
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