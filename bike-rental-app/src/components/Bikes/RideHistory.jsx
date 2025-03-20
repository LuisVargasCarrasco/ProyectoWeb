import { useState, useEffect } from 'react'
import { 
  Box, Card, CardContent, Typography, CircularProgress, Alert,
  Chip, Divider
} from '@mui/material'
import { supabase } from '../../services/supabase'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

const RideHistory = () => {
  const [trips, setTrips] = useState([])
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
        .from('trip')  // Changed from 'route' to 'trip'
        .select(`
          *,
          bike:bike_id (*),
          start_location:start_location_id (
            location_name,
            address
          ),
          end_location:end_location_id (
            location_name,
            address
          )
        `)
        .eq('user_id', user.id)
        .order('start_time', { ascending: false })

      if (error) {
        console.error('Supabase error:', error)
        throw error
      }

      console.log('Trip history:', data)
      setTrips(data || [])

    } catch (err) {
      console.error('Error fetching history:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <Box display="flex" justifyContent="center" m={4}><CircularProgress /></Box>
  if (error) return <Alert severity="error" sx={{ m: 2 }}>{error}</Alert>

  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 2 }}>Historial de Viajes</Typography>
      
      {trips.length === 0 ? (
        <Alert severity="info">No hay viajes en tu historial</Alert>
      ) : (
        trips.map(trip => (
          <Card key={trip.id} sx={{ mb: 2 }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">
                  Bicicleta #{trip.bike?.id}
                </Typography>
                <Chip 
                  label={trip.status === 'active' ? 'En curso' : 'Completado'}
                  color={trip.status === 'active' ? 'primary' : 'success'}
                />
              </Box>
              
              <Divider sx={{ my: 1 }}/>
              
              <Typography variant="subtitle2" color="textSecondary">
                Inicio del viaje:
              </Typography>
              <Typography variant="body1" gutterBottom>
                {format(new Date(trip.start_time), 'PPpp', { locale: es })}
              </Typography>
              <Typography variant="body1" gutterBottom>
                {trip.start_location?.location_name}
              </Typography>
              
              {trip.end_time && (
                <>
                  <Divider sx={{ my: 1 }}/>
                  <Typography variant="subtitle2" color="textSecondary">
                    Fin del viaje:
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    {format(new Date(trip.end_time), 'PPpp', { locale: es })}
                  </Typography>
                  <Typography variant="body1">
                    {trip.end_location?.location_name}
                  </Typography>
                </>
              )}
            </CardContent>
          </Card>
        ))
      )}
    </Box>
    )
}

export default RideHistory