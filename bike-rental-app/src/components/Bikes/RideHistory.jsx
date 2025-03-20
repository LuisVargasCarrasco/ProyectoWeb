import { useState, useEffect } from 'react'
import { Box, Card, CardContent, Typography } from '@mui/material'
import { supabase } from '../../services/supabase'

const RideHistory = () => {
  const [rides, setRides] = useState([])

  useEffect(() => {
    fetchHistory()
  }, [])

  const fetchHistory = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    const { data, error } = await supabase
      .from('reservations')
      .select('*, bikes(*)')
      .eq('user_id', user.id)
      .eq('status', 'completed')
      .order('start_time', { ascending: false })

    if (data) setRides(data)
  }

  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 2 }}>Historial de Viajes</Typography>
      {rides.map(ride => (
        <Card key={ride.id} sx={{ mb: 2 }}>
          <CardContent>
            <Typography>Bicicleta #{ride.bikes.id}</Typography>
            <Typography>Inicio: {new Date(ride.start_time).toLocaleString()}</Typography>
            <Typography>Fin: {new Date(ride.end_time).toLocaleString()}</Typography>
          </CardContent>
        </Card>
      ))}
    </Box>
  )
}

export default RideHistory