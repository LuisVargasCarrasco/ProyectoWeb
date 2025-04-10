import { Link } from 'react-router-dom'; // Agrega esta línea
import { useState, useEffect } from 'react';
import { supabase } from '../../services/supabase';
import {
  Box, Typography, Avatar, Paper, Grid, List, ListItem, ListItemIcon, ListItemText, Divider
} from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import HistoryIcon from '@mui/icons-material/History';
import DirectionsBikeIcon from '@mui/icons-material/DirectionsBike';
import StarIcon from '@mui/icons-material/Star';
import HelpIcon from '@mui/icons-material/Help';
import DescriptionIcon from '@mui/icons-material/Description';
import NatureIcon from '@mui/icons-material/Nature';

const Profile = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [profile, setProfile] = useState({
    email: '',
    name: '',
    profile_picture: '',
    rol: '',
    totalTrips: 0,
    co2Saved: 0
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);

      // Obtener el usuario actual
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user logged in');

      // Obtener datos del perfil del usuario
      const { data: userData, error: userError } = await supabase
        .from('user')
        .select('*')
        .eq('id', user.id)
        .single();
      if (userError) throw userError;

      // Contar los viajes del usuario desde la tabla 'trip'
      const { count: totalTrips, error: tripError } = await supabase
        .from('trip')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);
      if (tripError) throw tripError;

      // Actualizar el estado del perfil
      setProfile({
        email: userData.email,
        name: userData.name || 'Usuario',
        profile_picture: userData.profile_picture,
        rol: userData.rol,
        totalTrips: totalTrips || 0, // Total de viajes
        co2Saved: userData.co2_saved || 0 // CO₂ ahorrado
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (error) {
    return <Typography color="error">{error}</Typography>;
  }

  return (
    <Box sx={{ maxWidth: 600, mx: 'auto', p: 2 }}>
      <Paper elevation={3} sx={{ p: 4, borderRadius: 3 }}>
        {/* Header */}
        <Typography variant="h5" sx={{ fontWeight: 700, mb: 2 }}>
          Hi, {profile.name || 'User'}
        </Typography>

        {/* Statistics */}
        <Grid container spacing={2} sx={{ textAlign: 'center', mb: 3 }}>
          <Grid item xs={6}>
            <Box>
              <DirectionsCarIcon color="primary" sx={{ fontSize: 40 }} />
              <Typography variant="h6" sx={{ mt: 1 }}>
                {profile.totalTrips}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Viajes Totales
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={6}>
            <Box>
              <NatureIcon color="success" sx={{ fontSize: 40 }} />
              <Typography variant="h6" sx={{ mt: 1 }}>
                {profile.co2Saved}kg
              </Typography>
              <Typography variant="body2" color="text.secondary">
                CO₂ Ahorrado
              </Typography>
            </Box>
          </Grid>
        </Grid>

        <Divider sx={{ my: 3 }} />

        {/* Options List */}
        <List>
          <ListItem button component={Link} to="/user-profile">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            <ListItemText primary="Perfil" />
          </ListItem>
          <ListItem button component={Link} to="/RideHistory"> {/* Cambiado para redirigir al historial */}
            <ListItemIcon>
              <HistoryIcon />
            </ListItemIcon>
            <ListItemText primary="Historial de Viajes" />
          </ListItem>
          <ListItem button>
            <ListItemIcon>
              <HelpIcon />
            </ListItemIcon>
            <ListItemText primary="Help" />
          </ListItem>
        </List>
      </Paper>
    </Box>
  );
};

export default Profile;