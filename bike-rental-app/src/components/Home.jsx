import { useState, useEffect } from 'react';
import { Box, Typography, Paper, Grid, CircularProgress } from '@mui/material';
import PedalBikeIcon from '@mui/icons-material/PedalBike';
import ElectricBikeIcon from '@mui/icons-material/ElectricBike';
import TwoWheelerIcon from '@mui/icons-material/TwoWheeler';
import { createClient } from '@supabase/supabase-js';

// Configuración de Supabase
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const Home = () => {
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userName, setUserName] = useState(''); // Estado para el nombre del usuario

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        // Coordenadas fijas de Barcelona
        const latitude = 41.3851;
        const longitude = 2.1734;

        const apiKey = import.meta.env.VITE_OPENWEATHER_API_KEY;
        const response = await fetch(
          `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&units=metric&lang=es&appid=${apiKey}`
        );

        if (!response.ok) {
          throw new Error(`Error al obtener el clima: ${response.statusText}`);
        }

        const data = await response.json();
        console.log('Datos del clima:', data); // Depuración

        setWeather({
          location: data.name,
          temperature: data.main.temp,
          description: data.weather[0].description,
          icon: `https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png`,
        });
        setLoading(false);
      } catch (err) {
        console.error(err);
        setError('No se pudo obtener la información del clima');
        setLoading(false);
      }
    };
    fetchWeather(); // Llama a la función para obtener el clima
  }, []);

  const currentDate = new Date();
  const formattedDate = currentDate.toLocaleDateString('es-ES', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <Box sx={{ p: 3 }}>
      {/* Título de bienvenida */}
      <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 2 }}>
        ¡Bienvenido, a BikeShare!
      </Typography>

      {/* Información del clima */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 2 }}>
          Información del clima
        </Typography>
        {loading ? (
          <CircularProgress />
        ) : error ? (
          <Typography color="error">{error}</Typography>
        ) : (
          <Paper elevation={3} sx={{ p: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box
              component="img"
              src={weather.icon}
              alt={weather.description}
              sx={{ width: 50, height: 50 }}
            />
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                {weather.location}
              </Typography>
              <Typography variant="body2">{formattedDate}</Typography>
              <Typography variant="body2" sx={{ textTransform: 'capitalize' }}>
                {weather.description}
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                {weather.temperature}°C
              </Typography>
            </Box>
          </Paper>
        )}
      </Box>

      <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 2 }}>
        Nuestras Bicicletas
     </Typography>
      {/* Información de las bicicletas */}
      <Typography variant="body1" sx={{ mb: 4 }}>
        Explora nuestra flota de bicicletas y disfruta de la ciudad de una manera sostenible. Ofrecemos tres modelos de bicicletas para adaptarnos a tus necesidades.
      </Typography>

      <Grid container spacing={3}>
        {/* Modelo Eléctrico */}
        <Grid item xs={12} md={4}>
          <Paper elevation={3} sx={{ p: 3, textAlign: 'center' }}>
            <ElectricBikeIcon sx={{ fontSize: 50, color: 'primary.main', mb: 2 }} />
            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
              Bicicleta Eléctrica
            </Typography>
            <Typography variant="body2">
              Ideal para largas distancias y terrenos inclinados. Disfruta de un paseo sin esfuerzo.
            </Typography>
          </Paper>
        </Grid>

        {/* Modelo Normal */}
        <Grid item xs={12} md={4}>
          <Paper elevation={3} sx={{ p: 3, textAlign: 'center' }}>
            <PedalBikeIcon sx={{ fontSize: 50, color: 'primary.main', mb: 2 }} />
            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
              Bicicleta Normal
            </Typography>
            <Typography variant="body2">
              Perfecta para paseos relajados y desplazamientos diarios. Una opción clásica y confiable.
            </Typography>
          </Paper>
        </Grid>

        {/* Modelo Tándem */}
        <Grid item xs={12} md={4}>
          <Paper elevation={3} sx={{ p: 3, textAlign: 'center' }}>
            <TwoWheelerIcon sx={{ fontSize: 50, color: 'primary.main', mb: 2 }} />
            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
              Bicicleta Tándem
            </Typography>
            <Typography variant="body2">
              Comparte la experiencia con un amigo o familiar. ¡Diversión garantizada!
            </Typography>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Home;