import { GoogleMap, useLoadScript, Marker, InfoWindow } from '@react-google-maps/api';
import { useState, useEffect, useMemo, useCallback } from 'react';
import { Box, Paper, Typography, CircularProgress, Chip, Alert, Button } from '@mui/material';
import { supabase } from '../../services/supabase';
import PedalBikeIcon from '@mui/icons-material/PedalBike';
import DirectionsBikeIcon from '@mui/icons-material/DirectionsBike';

const BikeMap = () => {
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedLocation, setSelectedLocation] = useState(null);

  const center = useMemo(() => ({ lat: 41.3851, lng: 2.1734 }), []); // Plaza Catalunya

  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
  });

  const fetchLocationsWithBikes = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: locations, error: locError } = await supabase
        .from('location')
        .select(`
          *,
          bikes:bike(*)
        `);

      if (locError) throw locError;
      setLocations(locations || []);

    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLocationsWithBikes();
    
    const subscription = supabase
      .channel('bike-channel')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'bike' 
      }, fetchLocationsWithBikes)
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchLocationsWithBikes]);

  const handleMarkerClick = useCallback((location) => {
    setSelectedLocation(location);
  }, []);

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

  if (loadError) {
    return (
      <Alert 
        severity="error" 
        sx={{ m: 2 }}
      >
        Error al cargar el mapa: {loadError.message}
      </Alert>
    );
  }

  if (!isLoaded) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="100%">
        <CircularProgress />
      </Box>
    );
  }

  if (loading && !locations.length) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="100%">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert 
        severity="error" 
        sx={{ m: 2 }}
      >
        {error}
      </Alert>
    );
  }

  return (
    <Box sx={{ 
      display: 'flex', 
      flexDirection: 'column',
      height: '100%',
      gap: 2
    }}>
      <Paper 
        elevation={2} 
        sx={{ 
          p: 2,
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
        }}
      >
        <Typography variant="h5" sx={{ fontWeight: 600 }}>
          Estaciones de Bicicletas
        </Typography>
        <Chip 
          icon={<PedalBikeIcon />} 
          label={`${locations.reduce((acc, loc) => 
            acc + loc.bikes.filter(b => b.status === 'available').length, 0
          )} bicicletas disponibles`}
          color="primary"
          sx={{ 
            px: 1,
            '& .MuiChip-label': { fontWeight: 500 }
          }}
        />
      </Paper>
      
      <Paper 
        elevation={3} 
        sx={{ 
          flex: 1,
          minHeight: 0,
          overflow: 'hidden',
          borderRadius: 2
        }}
      >
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
                  ? '/bike-station-blue.png'
                  : '/bike-station-red.png',
                scaledSize: new window.google.maps.Size(40, 40)
              }}
            />  
          ))}
          {selectedLocation && (
            <InfoWindow
              position={{ 
                lat: selectedLocation.latitude, 
                lng: selectedLocation.longitude 
              }}
              onCloseClick={() => setSelectedLocation(null)}
            >
              <Box sx={{ 
                p: 1,
                minWidth: 200,
                '& .MuiTypography-root': { mb: 1 }
              }}>
                <Typography 
                  variant="subtitle1" 
                  sx={{ 
                    fontWeight: 600,
                    color: 'primary.main'
                  }}
                >
                  {selectedLocation.location_name}
                </Typography>
                <Typography 
                  variant="body2" 
                  sx={{ color: 'text.secondary' }}
                >
                  {selectedLocation.address}
                </Typography>
                <Typography 
                  variant="body2" 
                  sx={{ 
                    bgcolor: 'primary.light',
                    color: 'white',
                    p: 1,
                    borderRadius: 1,
                    display: 'inline-block'
                  }}
                >
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
                    sx={{ 
                      mt: 2,
                      width: '100%',
                      boxShadow: 2
                    }}
                  >
                    Reservar
                  </Button>
                )}
              </Box>
            </InfoWindow>
          )}
        </GoogleMap>
      </Paper>
    </Box>
  );
};

export default BikeMap;