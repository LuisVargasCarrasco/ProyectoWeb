import { useState, useEffect, useRef } from 'react';
import {
  Box, Card, CardContent, Typography, Button, CircularProgress, Alert,
  Paper, Avatar, Chip, Dialog, DialogTitle, DialogContent, DialogActions,
  FormControl, InputLabel, Select, MenuItem
} from '@mui/material';
import { supabase } from '../../services/supabase';
import { GoogleMap, useLoadScript, Marker, DirectionsRenderer } from '@react-google-maps/api';
import InfoIcon from '@mui/icons-material/Info';
import DirectionsBikeIcon from '@mui/icons-material/DirectionsBike';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import TimerIcon from '@mui/icons-material/Timer';

const TRIP_STATUS = {
  RESERVED: 'reserved',
  ACTIVE: 'active',
  COMPLETED: 'completed'
};

const BIKE_STATUS = {
  AVAILABLE: 'available',
  IN_USE: 'in_use',
  RESERVED: 'reserved'
};

const ActiveRides = () => {
  const [activeTrips, setActiveTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [returnDialog, setReturnDialog] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState('');
  const [locations, setLocations] = useState([]);
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [directions, setDirections] = useState(null);
  const [currentPosition, setCurrentPosition] = useState(null);
  const [simulationDialog, setSimulationDialog] = useState(false);
  const intervalRef = useRef(null);

  const { isLoaded: mapsLoaded } = useLoadScript({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY
  });

  useEffect(() => {
    fetchActiveTrips();
    fetchLocations();

    const subscription = supabase
      .channel('trip-changes')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'trip' },
        () => fetchActiveTrips()
      )
      .subscribe();

    return () => subscription.unsubscribe();
  }, []);

  const fetchLocations = async () => {
    try {
      const { data, error } = await supabase
        .from('location')
        .select('id, location_name, latitude, longitude');

      if (error) throw error;
      setLocations(data || []);
    } catch (err) {
      console.error('Error fetching locations:', err);
      setError('Error al cargar las ubicaciones');
    }
  };

  const fetchActiveTrips = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();

      const { data, error } = await supabase
        .from('trip')
        .select(`
          id,
          bike_id,
          start_time,
          status,
          start_location_id,
          bike:bike_id (
            id,
            model_id
          ),
          start_location:start_location_id (
            id,
            location_name,
            latitude,
            longitude
          )
        `)
        .eq('user_id', user.id)
        .eq('status', TRIP_STATUS.ACTIVE);

      if (error) throw error;
      setActiveTrips(data || []);
    } catch (err) {
      console.error('Error fetching active trips:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFinishTrip = async (trip) => {
    setSelectedTrip(trip);
    setReturnDialog(true);
  };

  const confirmReturn = async () => {
    try {
      if (!selectedLocation || !selectedTrip) return;

      // Update trip status
      const { error: tripError } = await supabase
        .from('trip')
        .update({
          status: TRIP_STATUS.COMPLETED,
          end_time: new Date().toISOString(),
          end_location_id: selectedLocation
        })
        .eq('id', selectedTrip.id);

      if (tripError) throw tripError;

      // Update bike status
      const { error: bikeError } = await supabase
        .from('bike')
        .update({
          status: BIKE_STATUS.AVAILABLE,
          current_location_id: selectedLocation
        })
        .eq('id', selectedTrip.bike_id);

      if (bikeError) throw bikeError;

      setReturnDialog(false);
      setSelectedLocation('');
      setSelectedTrip(null);
      alert('¡Viaje finalizado correctamente!');
      await fetchActiveTrips();
    } catch (err) {
      console.error('Error finishing trip:', err);
      setError('Error al finalizar el viaje: ' + err.message);
    }
  };

  const startTripSimulation = (startLocation, endLocation) => {
    const directionsService = new window.google.maps.DirectionsService();
    directionsService.route(
      {
        origin: startLocation,
        destination: endLocation,
        travelMode: window.google.maps.TravelMode.BICYCLING
      },
      (result, status) => {
        if (status === window.google.maps.DirectionsStatus.OK) {
          setDirections(result);
          const steps = result.routes[0].legs[0].steps;
          let stepIndex = 0;
          let latLngIndex = 0;

          intervalRef.current = setInterval(() => {
            if (latLngIndex < steps[stepIndex].lat_lngs.length) {
              setCurrentPosition(steps[stepIndex].lat_lngs[latLngIndex]);
              latLngIndex++;
            } else {
              stepIndex++;
              latLngIndex = 0;
              if (stepIndex >= steps.length) {
                clearInterval(intervalRef.current);
              }
            }
          }, 1000);
        } else {
          console.error(`error fetching directions ${result}`);
        }
      }
    );
  };

  const handleOpenSimulation = (trip) => {
    setSelectedTrip(trip);
    setSimulationDialog(true);
    const startLocation = {
      lat: Number(trip.start_location.latitude),
      lng: Number(trip.start_location.longitude)
    };
    const endLocation = locations.find(loc => loc.id === trip.start_location_id);
    if (endLocation) {
      startTripSimulation(startLocation, {
        lat: Number(endLocation.latitude),
        lng: Number(endLocation.longitude)
      });
    }
  };

  const handleCloseSimulation = () => {
    setSimulationDialog(false);
    setSelectedTrip(null);
    setDirections(null);
    setCurrentPosition(null);
    clearInterval(intervalRef.current);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="100%">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        {error}
      </Alert>
    );
  }

  return (
    <>
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
              Viajes Activos
            </Typography>
          </Box>
          <Chip
            icon={<DirectionsBikeIcon />}
            label={`${activeTrips.length} ${activeTrips.length === 1 ? 'viaje' : 'viajes'}`}
            sx={{
              bgcolor: 'white',
              color: 'primary.main',
              '& .MuiChip-icon': { color: 'primary.main' }
            }}
          />
        </Paper>

        {activeTrips.length === 0 ? (
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
                        Bicicleta #{trip.bike?.id}
                        <Chip
                          label={`Modelo ${trip.bike?.model_id}`}
                          size="small"
                          sx={{ ml: 1 }}
                          color="primary"
                          variant="outlined"
                        />
                      </Typography>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, mt: 0.5 }}>
                        <Typography
                          variant="body2"
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1,
                            color: 'text.secondary'
                          }}
                        >
                          <TimerIcon fontSize="small" />
                          Inicio: {new Date(trip.start_time).toLocaleString()}
                        </Typography>
                        {trip.start_location && (
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
                            Inicio en: {trip.start_location.location_name}
                          </Typography>
                        )}
                      </Box>
                    </Box>
                  </Box>

                  <Button
                    variant="contained"
                    fullWidth
                    onClick={() => handleFinishTrip(trip)}
                    startIcon={<LocationOnIcon />}
                    sx={{ mt: 1, py: 1 }}
                  >
                    Finalizar Viaje
                  </Button>
                  <Button
                    variant="outlined"
                    fullWidth
                    onClick={() => handleOpenSimulation(trip)}
                    startIcon={<DirectionsBikeIcon />}
                    sx={{ mt: 1, py: 1 }}
                  >
                    Ver Simulación
                  </Button>
                </CardContent>
              </Card>
            ))}
          </Box>
        )}
      </Box>

      <Dialog
        open={returnDialog}
        onClose={() => {
          setReturnDialog(false);
          setSelectedLocation('');
          setSelectedTrip(null);
        }}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Finalizar Viaje</DialogTitle>
        <DialogContent>
          <FormControl fullWidth sx={{ mt: 2, mb: 2 }}>
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

          {mapsLoaded && selectedTrip?.start_location && (
            <Box sx={{ height: 300, width: '100%', borderRadius: 1, overflow: 'hidden' }}>
              <GoogleMap
                mapContainerStyle={{ width: '100%', height: '100%' }}
                center={{
                  lat: Number(selectedTrip.start_location.latitude),
                  lng: Number(selectedTrip.start_location.longitude)
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
                    lat: Number(selectedTrip.start_location.latitude),
                    lng: Number(selectedTrip.start_location.longitude)
                  }}
                  icon={{
                    url: '/bike-station-blue.png',
                    scaledSize: new window.google.maps.Size(30, 30)
                  }}
                />
                {selectedLocation && locations.map(loc => {
                  if (loc.id === selectedLocation) {
                    return (
                      <Marker
                        key={loc.id}
                        position={{
                          lat: Number(loc.latitude),
                          lng: Number(loc.longitude)
                        }}
                        icon={{
                          url: '/bike-station-red.png',
                          scaledSize: new window.google.maps.Size(30, 30)
                        }}
                      />
                    );
                  }
                  return null;
                })}
                {directions && (
                  <DirectionsRenderer
                    directions={directions}
                    options={{
                      suppressMarkers: true,
                      polylineOptions: {
                        strokeColor: '#ff0000',
                        strokeOpacity: 0.7,
                        strokeWeight: 5
                      }
                    }}
                  />
                )}
                {currentPosition && (
                  <Marker
                    position={currentPosition}
                    icon={{
                      url: '/bike-icon.png',
                      scaledSize: new window.google.maps.Size(30, 30)
                    }}
                  />
                )}
              </GoogleMap>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setReturnDialog(false);
            setSelectedLocation('');
            setSelectedTrip(null);
          }}>
            Cancelar
          </Button>
          <Button
            onClick={confirmReturn}
            variant="contained"
            disabled={!selectedLocation}
          >
            Confirmar Devolución
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={simulationDialog}
        onClose={handleCloseSimulation}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Simulación de Viaje</DialogTitle>
        <DialogContent>
          {mapsLoaded && selectedTrip?.start_location && (
            <Box sx={{ height: 400, width: '100%', borderRadius: 1, overflow: 'hidden' }}>
              <GoogleMap
                mapContainerStyle={{ width: '100%', height: '100%' }}
                center={currentPosition || {
                  lat: Number(selectedTrip.start_location.latitude),
                  lng: Number(selectedTrip.start_location.longitude)
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
                    lat: Number(selectedTrip.start_location.latitude),
                    lng: Number(selectedTrip.start_location.longitude)
                  }}
                  icon={{
                    url: '/bike-station-blue.png',
                    scaledSize: new window.google.maps.Size(30, 30)
                  }}
                />
                {directions && (
                  <DirectionsRenderer
                    directions={directions}
                    options={{
                      suppressMarkers: true,
                      polylineOptions: {
                        strokeColor: '#ff0000',
                        strokeOpacity: 0.7,
                        strokeWeight: 5
                      }
                    }}
                  />
                )}
                {currentPosition && (
                  <Marker
                    position={currentPosition}
                    icon={{
                      url: '/bike-icon.png',
                      scaledSize: new window.google.maps.Size(30, 30)
                    }}
                  />
                )}
              </GoogleMap>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseSimulation}>
            Cerrar
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default ActiveRides;