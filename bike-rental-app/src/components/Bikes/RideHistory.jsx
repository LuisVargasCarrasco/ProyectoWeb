import { useState, useEffect } from 'react'
import { Box, Card, CardContent, Typography, CircularProgress, Alert } from '@mui/material'
import { supabase } from '../../services/supabase'

const RideHistory = () => {
  const [rides, setRides] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchHistory()
  }, [])

  const fetchHistory = async () => {
    try {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) throw new Error('No user logged in')

      const { data, error } = await supabase
        .from('bike')
        .select(`
          id,
          model_id,
          current_location_id,
          status,
          location:current_location_id (
            location_name,
            address
          )
        `)
        .eq('status', 'in_use')
        .order('id', { ascending: false })

      if (error) throw error

      console.log('Ride history:', data)
      setRides(data || [])

    } catch (err) {
      console.error('Error fetching history:', err)
      setError(err.message)
    } finally {
      setLoading(false)
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
      <Typography variant="h5" sx={{ mb: 2 }}>Historial de Viajes</Typography>
      
      {rides.length === 0 ? (
        <Alert severity="info">No hay viajes en tu historial</Alert>
      ) : (
        rides.map(ride => (
          <Card key={ride.id} sx={{ mb: 2 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Bicicleta #{ride.id}
              </Typography>
              <Typography variant="body1" gutterBottom>
                Ubicación: {ride.location?.location_name || 'No disponible'}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Dirección: {ride.location?.address || 'No disponible'}
              </Typography>
            </CardContent>
          </Card>
        ))
      )}
    </Box>
  )
}

export default RideHistory