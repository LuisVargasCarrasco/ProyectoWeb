import { GoogleMap, LoadScript, Marker, InfoWindow } from '@react-google-maps/api';
import { useState, useEffect } from 'react';
import { Box, Paper, Typography, CircularProgress, Chip, Alert, Button } from '@mui/material';
import { supabase } from '../../services/supabase';
import PedalBikeIcon from '@mui/icons-material/PedalBike';
import DirectionsBikeIcon from '@mui/icons-material/DirectionsBike';

const BikeMap = () => {
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const center = { lat: 41.3851, lng: 2.1734 }; // Plaza Catalunya

  useEffect(() => {
    fetchLocationsWithBikes();
    // Set up real-time subscription
    const subscription = supabase
      .channel('bike-channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bike' }, fetchLocationsWithBikes)
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const fetchLocationsWithBikes = async () => {
    try {
      setLoading(true);
      setError(null);

      // First get all locations
      const { data: locations, error: locError } = await supabase
        .from('location')
        .select(`
          *,
          bikes:bike(*)
        `);

      if (locError) throw locError;

      console.log('Locations with bikes:', locations);
      setLocations(locations || []);

    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkerClick = (location) => {
    console.log('Selected location:', location);
    setSelectedLocation(location);
  };

  const handleReserveBike = async (bikeId) => {
    try {
      const { error } = await supabase
        .from('bike')
        .update({ status: 'reserved' })
        .eq('id', bikeId);

      if (error) throw error;
      
      fetchLocationsWithBikes();
      setSelectedLocation(null);
    } catch (err) {
      console.error('Error reserving bike:', err);
      setError('Error al reservar la bicicleta');
    }
  };

  // ... loading and error states remain the same ...

  return (
    <Box sx={{ 
      display: 'flex', 
      flexDirection: 'column',
      height: '100%'
    }}>
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        mb: 2
      }}>
        <Typography variant="h5">
          Estaciones de Bicicletas
        </Typography>
        <Chip 
          icon={<PedalBikeIcon />} 
          label={`${locations.reduce((acc, loc) => 
            acc + loc.bikes.filter(b => b.status === 'available').length, 0
          )} bicicletas disponibles`}
          color="primary"
        />
      </Box>
      <Paper elevation={3} sx={{ 
        flex: 1,
        minHeight: 0,
        borderRadius: 2,
        overflow: 'hidden'
      }}>
        <LoadScript googleMapsApiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY}>
          <GoogleMap
            mapContainerStyle={{
              width: '100%',
              height: '100%'
            }}
            center={center}
            zoom={14}
            options={{
              styles: [{ elementType: "labels", featureType: "poi", stylers: [{ visibility: "off" }] }],
              disableDefaultUI: false,
              zoomControl: true,
              mapTypeControl: false,
              streetViewControl: false,
              fullscreenControl: true
            }}
          >
            {locations.map((location) => (
              <Marker
                key={location.id}
                position={{ lat: location.latitude, lng: location.longitude }}
                onClick={() => handleMarkerClick(location)}
                icon={{
                  url: location.bikes.some(b => b.status === 'available')
                    ? 'https://maps.google.com/mapfiles/ms/icons/green-dot.png'
                    : 'https://maps.google.com/mapfiles/ms/icons/red-dot.png',
                  scaledSize: new window.google.maps.Size(32, 32)
                }}
              />
            ))}
            {selectedLocation && (
              <InfoWindow
                position={{ lat: selectedLocation.latitude, lng: selectedLocation.longitude }}
                onCloseClick={() => setSelectedLocation(null)}
              >
                <Box sx={{ p: 1 }}>
                  <Typography variant="subtitle1" gutterBottom>
                    {selectedLocation.location_name}
                  </Typography>
                  <Typography variant="body2" gutterBottom>
                    {selectedLocation.address}
                  </Typography>
                  <Typography variant="body2" gutterBottom>
                    Bicicletas disponibles: {
                      selectedLocation.bikes.filter(b => b.status === 'available').length
                    }
                  </Typography>
                  {selectedLocation.bikes.some(b => b.status === 'available') && (
                    <Button
                      variant="contained"
                      size="small"
                      startIcon={<DirectionsBikeIcon />}
                      onClick={() => handleReserveBike(
                        selectedLocation.bikes.find(b => b.status === 'available').id
                      )}
                    >
                      Reservar
                    </Button>
                  )}
                </Box>
              </InfoWindow>
            )}
          </GoogleMap>
        </LoadScript>
      </Paper>
    </Box>
  );
};

export default BikeMap;