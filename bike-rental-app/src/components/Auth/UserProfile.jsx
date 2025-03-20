import { useState, useEffect } from 'react';
import { supabase } from '../../services/supabase';
import { 
  Box, TextField, Button, Typography, Avatar, 
  Paper, Divider, Alert, CircularProgress 
} from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import EmailIcon from '@mui/icons-material/Email';
import BadgeIcon from '@mui/icons-material/Badge';

const UserProfile = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [profile, setProfile] = useState({
    email: '',
    name: '',
    dni: '',
    profile_picture: '',
    rol: ''
  });
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    dni: ''
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) throw new Error('No user logged in');

      const { data, error } = await supabase
        .from('user')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) throw error;

      setProfile({
        email: data.email,
        name: data.name || '',
        dni: data.dni || '',
        profile_picture: data.profile_picture,
        rol: data.rol
      });
      
      setFormData({
        name: data.name || '',
        dni: data.dni || ''
      });

    } catch (err) {
      console.error('Error fetching profile:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();

      const { error } = await supabase
        .from('user')
        .update({
          name: formData.name,
          dni: formData.dni
        })
        .eq('id', user.id);

      if (error) throw error;

      setProfile(prev => ({
        ...prev,
        name: formData.name,
        dni: formData.dni
      }));
      
      setEditing(false);
      alert('Perfil actualizado correctamente');

    } catch (err) {
      console.error('Error updating profile:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error" sx={{ m: 2 }}>{error}</Alert>;
  }

  return (
    <Box sx={{ maxWidth: 600, mx: 'auto', p: 2 }}>
      <Paper elevation={2} sx={{ p: 3, borderRadius: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <Avatar
            src={profile.profile_picture}
            sx={{ 
              width: 80, 
              height: 80, 
              bgcolor: 'primary.main',
              fontSize: '2rem'
            }}
          >
            {!profile.profile_picture && (profile.name?.charAt(0) || <PersonIcon fontSize="large" />)}
          </Avatar>
          <Box sx={{ ml: 2 }}>
            <Typography variant="h5" sx={{ fontWeight: 600 }}>
              {profile.name || 'Usuario'}
            </Typography>
            <Typography variant="body1" color="text.secondary">
              <EmailIcon sx={{ fontSize: 16, mr: 0.5, verticalAlign: 'text-bottom' }} />
              {profile.email}
            </Typography>
            <Typography 
              variant="body2" 
              sx={{ 
                mt: 0.5,
                color: 'primary.main',
                bgcolor: 'primary.light',
                px: 1,
                py: 0.5,
                borderRadius: 1,
                display: 'inline-block',
                color: 'white'
              }}
            >
              {profile.rol}
            </Typography>
          </Box>
        </Box>

        <Divider sx={{ my: 3 }} />

        {editing ? (
          <Box component="form" onSubmit={handleUpdate}>
            <TextField
              fullWidth
              label="Nombre"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="DNI"
              value={formData.dni}
              onChange={(e) => setFormData(prev => ({ ...prev, dni: e.target.value }))}
              sx={{ mb: 2 }}
              InputProps={{
                startAdornment: (
                  <BadgeIcon sx={{ mr: 1, color: 'text.secondary' }} />
                ),
              }}
            />
            <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
              <Button 
                onClick={() => setEditing(false)}
                sx={{ color: 'text.secondary' }}
              >
                Cancelar
              </Button>
              <Button 
                type="submit"
                variant="contained"
                disabled={loading}
              >
                Guardar cambios
              </Button>
            </Box>
          </Box>
        ) : (
          <Box>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Información Personal
            </Typography>
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Nombre
              </Typography>
              <Typography variant="body1">
                {profile.name || 'No especificado'}
              </Typography>
            </Box>
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary">
                DNI
              </Typography>
              <Typography variant="body1">
                {profile.dni || 'No especificado'}
              </Typography>
            </Box>
            <Button
              variant="outlined"
              onClick={() => setEditing(true)}
              sx={{ mt: 2 }}
              startIcon={<PersonIcon />}
            >
              Editar perfil
            </Button>
          </Box>
        )}
      </Paper>
    </Box>
  );
};

export default UserProfile;