import { GoogleMap, useLoadScript, Marker } from '@react-google-maps/api';
import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Box, Paper, CircularProgress, Alert, Button, Select, MenuItem,
  Radio, RadioGroup, FormControlLabel, Dialog, DialogTitle,
  DialogContent, DialogActions, Typography
} from '@mui/material';
import { supabase } from '../../services/supabase';

const BikeMap = () => {
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [selectedModel, setSelectedModel] = useState('');
  const [modelDialog, setModelDialog] = useState(false);
  const [filterOption, setFilterOption] = useState('all'); // Filtro: 'all', 'available', 'nearby'

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
      console.log('Ubicaciones con bicicletas:', locations); // Depuración
      setLocations(locations || []);
    } catch (err) {
      console.error('Error fetching locations with bikes:', err);
      setError('Error al cargar las ubicaciones con bicicletas');
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

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.watchPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setUserLocation({ lat: latitude, lng: longitude });
        },
        (error) => {
          console.error('Error getting user location:', error);
          setError('Error al obtener la ubicación del usuario');
        }
      );
    }
  }, []);

  const handleMarkerClick = useCallback((location) => {
    setSelectedLocation(location);
    setModelDialog(true);
  }, []);

  const handleReserveBike = async () => {
    try {
      if (!selectedModel) {
        alert('Por favor, selecciona un modelo de bicicleta');
        return;
      }

      const { data, error } = await supabase
        .from('bike')
        .select('*')
        .eq('status', 'available')
        .eq('model', selectedModel)
        .eq('current_location_id', selectedLocation.id);

      if (error) throw error;

      if (data.length === 0) {
        alert('No hay bicicletas disponibles para el modelo seleccionado en esta ubicación');
        return;
      }

      const bikeToReserve = data[0];
      const { error: reserveError } = await supabase
        .from('bike')
        .update({ status: 'reserved' })
        .eq('id', bikeToReserve.id);

      if (reserveError) throw reserveError;

      alert(`¡Bicicleta modelo ${bikeToReserve.model} reservada con éxito!`);
      setModelDialog(false);
      fetchLocationsWithBikes();
      setSelectedLocation(null);
    } catch (err) {
      console.error('Error reserving bike:', err);
      alert('Error al reservar la bicicleta: ' + err.message);
    }
  };

  const filterLocations = () => {
    if (filterOption === 'available') {
      return locations.filter((location) =>
        location.bikes.some((bike) => bike.status === 'available')
      );
    }

    if (filterOption === 'nearby' && userLocation) {
      const EARTH_RADIUS_KM = 6371; // Radio de la Tierra en kilómetros

      const haversineDistance = (lat1, lon1, lat2, lon2) => {
        const toRadians = (degrees) => (degrees * Math.PI) / 180;
        const dLat = toRadians(lat2 - lat1);
        const dLon = toRadians(lon2 - lon1);
        const lat1Rad = toRadians(lat1);
        const lat2Rad = toRadians(lat2);

        const a =
          Math.sin(dLat / 2) * Math.sin(dLat / 2) +
          Math.cos(lat1Rad) * Math.cos(lat2Rad) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return EARTH_RADIUS_KM * c;
      };

      return locations.filter((location) => {
        const distance = haversineDistance(
          userLocation.lat,
          userLocation.lng,
          location.latitude,
          location.longitude
        );
        return distance <= 1; // Filtrar estaciones a 1 km o menos
      });
    }

    return locations; // 'all' option
  };

  if (loadError) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
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
      <Alert severity="error" sx={{ m: 2 }}>
        {error}
      </Alert>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', gap: 2 }}>
      <Select
        value={filterOption}
        onChange={(e) => setFilterOption(e.target.value)}
        sx={{ mb: 2 }}
      >
        <MenuItem value="all">Todas las estaciones</MenuItem>
        <MenuItem value="available">Estaciones con bicicletas disponibles</MenuItem>
        <MenuItem value="nearby">Estaciones cercanas</MenuItem>
      </Select>

      <Paper
        elevation={3}
        sx={{
          flex: 1,
          minHeight: 0,
          overflow: 'auto',
          borderRadius: 2
        }}
      >
        <GoogleMap
          mapContainerStyle={{
            width: '100%',
            height: '100%'
          }}
          center={userLocation || center}
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
          {userLocation && (
            <Marker
              position={userLocation}
              icon={{
                url: '/user-location.png',
                scaledSize: new window.google.maps.Size(40, 40),
              }}
            />
          )}

          {filterLocations().map((location) => (
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
        </GoogleMap>
      </Paper>

      <Dialog
        open={modelDialog}
        onClose={() => setModelDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>{selectedLocation?.location_name}</DialogTitle>
        <DialogContent>
          {console.log('Bicicletas en la ubicación seleccionada:', selectedLocation?.bikes)}
          <RadioGroup
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value)}
          >
            {['normal', 'electric', 'tandem'].map((model) => {
              const count = selectedLocation?.bikes
                ?.filter((bike) => bike.model === model && bike.status === 'available')
                .length || 0;

              const modelImages = {
                normal: '/bike.png',
                electric: '/electric-bike.png',
                tandem: '/tandem.png',
              };

              return (
                <FormControlLabel
                  key={model}
                  value={model}
                  control={<Radio />}
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Box
                        component="img"
                        src={modelImages[model]}
                        alt={`Bicicleta ${model}`}
                        sx={{ width: 40, height: 40 }}
                      />
                      <Typography>
                        {`${model.charAt(0).toUpperCase() + model.slice(1)}: ${count}`}
                      </Typography>
                    </Box>
                  }
                  disabled={count === 0} // Deshabilitar si no hay bicicletas disponibles
                />
              );
            })}
          </RadioGroup>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setModelDialog(false)}>Cancelar</Button>
          <Button onClick={handleReserveBike} variant="contained">
            Reservar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default BikeMap;