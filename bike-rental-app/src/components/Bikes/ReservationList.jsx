import { useState, useEffect } from 'react'
import { Box, Card, CardContent, Typography, Button, CircularProgress, Alert } from '@mui/material'
import { supabase } from '../../services/supabase'

const ReservationList = () => {
  const [reservedBikes, setReservedBikes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchReservedBikes()
  }, [])

  const fetchReservedBikes = async () => {
    try {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      
      // Get bikes that are reserved by the current user
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
      <Typography variant="h5" sx={{ mb: 2 }}>Mis Bicicletas Reservadas</Typography>
      {reservedBikes.length === 0 ? (
        <Alert severity="info">No tienes bicicletas reservadas</Alert>
      ) : (
        reservedBikes.map(bike => (
          <Card key={bike.id} sx={{ mb: 2 }}>
            <CardContent>
              <Typography variant="h6">Bicicleta #{bike.id}</Typography>
              <Typography variant="body1" gutterBottom>
                Ubicación: {bike.location?.location_name}
              </Typography>
              <Typography variant="body2" color="textSecondary" gutterBottom>
                Dirección: {bike.location?.address}
              </Typography>
              <Button 
                variant="contained" 
                onClick={() => handleUnlock(bike.id)}
                sx={{ mt: 1 }}
              >
                Desbloquear
              </Button>
            </CardContent>
          </Card>
        ))
      )}
    </Box>
  )
}

export default ReservationList