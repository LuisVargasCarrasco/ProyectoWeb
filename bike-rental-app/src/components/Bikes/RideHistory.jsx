import { Link } from 'react-router-dom';
import { useState, useEffect, useCallback } from 'react'
import {
  Box, Card, CardContent, Typography, CircularProgress, Alert,
  Chip, Divider, IconButton, Collapse, Paper, Avatar
} from '@mui/material'
import { supabase } from '../../services/supabase'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { GoogleMap, useLoadScript, Marker, DirectionsRenderer } from '@react-google-maps/api'
import InfoIcon from '@mui/icons-material/Info'
import DirectionsBikeIcon from '@mui/icons-material/DirectionsBike'
import LocationOnIcon from '@mui/icons-material/LocationOn'
import AccessTimeIcon from '@mui/icons-material/AccessTime'
import MapIcon from '@mui/icons-material/Map'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import ExpandLessIcon from '@mui/icons-material/ExpandLess'

const TRIP_STATUS = {
  RESERVED: 'reserved',
  ACTIVE: 'active',
  COMPLETED: 'completed'
}

const RideHistory = () => {
  const [trips, setTrips] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [directions, setDirections] = useState({})
  const [expandedMap, setExpandedMap] = useState({})

  const { isLoaded: mapsLoaded, loadError } = useLoadScript({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
  })

  useEffect(() => {
    fetchHistory()
  }, [])

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) throw new Error('No user logged in');

      const { data, error } = await supabase
        .from('trip')
        .select(`
          id,
          bike_id,
          start_time,
          end_time,
          status,
          start_location_id,
          end_location_id,
          route,
          bike:bike_id (
            id,
            model_id
          ),
          start_location:start_location_id (
            id,
            location_name,
            latitude,
            longitude
          ),
          end_location:end_location_id (
            id,
            location_name,
            latitude,
            longitude
          )
        `)
        .eq('user_id', user.id)
        .eq('status', TRIP_STATUS.COMPLETED)
        .order('start_time', { ascending: false });

      if (error) throw error;
      setTrips(data || []);

    } catch (err) {
      console.error('Error fetching history:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchDirections = useCallback(async (trip) => {
    if (!directions[trip.id] && window.google && trip.start_location && trip.end_location) {
      const directionsService = new window.google.maps.DirectionsService()

      try {
        const result = await directionsService.route({
          origin: {
            lat: Number(trip.start_location.latitude),
            lng: Number(trip.start_location.longitude)
          },
          destination: {
            lat: Number(trip.end_location.latitude),
            lng: Number(trip.end_location.longitude)
          },
          travelMode: window.google.maps.TravelMode.BICYCLING,
        })

        setDirections(prev => ({
          ...prev,
          [trip.id]: result
        }))
      } catch (error) {
        console.error("Error fetching directions:", error)
      }
    }
  }, [directions])

  const handleExpandMap = useCallback((trip) => {
    setExpandedMap(prev => {
      const newState = { ...prev, [trip.id]: !prev[trip.id] }

      // If expanding, fetch directions
      if (newState[trip.id]) {
        fetchDirections(trip)
      }

      return newState
    })
  }, [fetchDirections])

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="100%">
        <CircularProgress />
      </Box>
    )
  }

  if (error || loadError) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        {error || loadError.message}
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
            Historial de Viajes
          </Typography>
        </Box>
        <Chip
          icon={<DirectionsBikeIcon />}
          label={`${trips.length} ${trips.length === 1 ? 'viaje' : 'viajes'}`}
          sx={{
            bgcolor: 'white',
            color: 'primary.main',
            '& .MuiChip-icon': { color: 'primary.main' }
          }}
        />
      </Paper>

      {trips.length === 0 ? (
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
              No hay viajes en tu historial
            </Typography>
            <Typography variant="body1">
              Aquí aparecerán tus viajes cuando los completes
            </Typography>
          </Box>
        </Card>
      ) : (
        <Box sx={{ flex: 1, overflow: 'auto' }}>
          {trips.map(trip => (
            <Card
              key={trip.id}
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
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Avatar sx={{ bgcolor: 'primary.light' }}>
                      <DirectionsBikeIcon />
                    </Avatar>
                    <Box>
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        Bicicleta #{trip.bike?.id}
                        <Chip
                          label={`Modelo ${trip.bike?.model_id}`}
                          size="small"
                          sx={{ ml: 1 }}
                          color="primary"
                          variant="outlined"
                        />
                      </Typography>
                    </Box>
                  </Box>
                  <IconButton
                    onClick={() => handleExpandMap(trip)}
                    color="primary"
                  >
                    {expandedMap[trip.id] ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                  </IconButton>
                </Box>

                <Divider sx={{ my: 2 }} />

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Box>
                    <Typography variant="subtitle2" color="textSecondary" sx={{ mb: 1 }}>
                      Inicio del viaje
                    </Typography>
                    {trip.start_location && (
                      <>
                        <Typography
                          variant="body2"
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1,
                            color: 'text.secondary',
                            mb: 0.5
                          }}
                        >
                          <LocationOnIcon fontSize="small" />
                          {trip.start_location.location_name}
                        </Typography>
                        <Typography
                          variant="body2"
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1,
                            color: 'text.secondary'
                          }}
                        >
                          <AccessTimeIcon fontSize="small" />
                          {format(new Date(trip.start_time), 'PPpp', { locale: es })}
                        </Typography>
                      </>
                    )}
                  </Box>

                  <Box>
                    <Typography variant="subtitle2" color="textSecondary" sx={{ mb: 1 }}>
                      Fin del viaje
                    </Typography>
                    {trip.end_location && (
                      <>
                        <Typography
                          variant="body2"
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1,
                            color: 'text.secondary',
                            mb: 0.5
                          }}
                        >
                          <LocationOnIcon fontSize="small" />
                          {trip.end_location.location_name}
                        </Typography>
                        <Typography
                          variant="body2"
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1,
                            color: 'text.secondary'
                          }}
                        >
                          <AccessTimeIcon fontSize="small" />
                          {format(new Date(trip.end_time), 'PPpp', { locale: es })}
                        </Typography>
                      </>
                    )}
                  </Box>
                </Box>

                <Collapse in={expandedMap[trip.id]}>
                  {mapsLoaded && trip.start_location && trip.end_location && (
                    <Box sx={{ height: 200, mt: 2, borderRadius: 1, overflow: 'hidden' }}>
                      <GoogleMap
                        mapContainerStyle={{
                          width: '100%',
                          height: '100%'
                        }}
                        center={{
                          lat: Number(trip.start_location.latitude),
                          lng: Number(trip.start_location.longitude)
                        }}
                        zoom={13}
                        options={{
                          disableDefaultUI: true,
                          zoomControl: true,
                          scrollwheel: false
                        }}
                      >
                        <Marker
                          position={{
                            lat: Number(trip.start_location.latitude),
                            lng: Number(trip.start_location.longitude)
                          }}
                          icon={{
                            url: '/bike-station-blue.png',
                            scaledSize: new window.google.maps.Size(30, 30)
                          }}
                        />
                        <Marker
                          position={{
                            lat: Number(trip.end_location.latitude),
                            lng: Number(trip.end_location.longitude)
                          }}
                          icon={{
                            url: '/bike-station-red.png',
                            scaledSize: new window.google.maps.Size(30, 30)
                          }}
                        />
                        {directions[trip.id] && (
                          <DirectionsRenderer
                            directions={directions[trip.id]}
                            options={{
                              suppressMarkers: true,
                              polylineOptions: {
                                strokeColor: '#2E7D32',
                                strokeWeight: 4
                              }
                            }}
                          />
                        )}
                      </GoogleMap>
                    </Box>
                  )}
                </Collapse>
              </CardContent>
            </Card>
          ))}
        </Box>
      )}
    </Box>
  )
}

export default RideHistory