import { useState, useEffect } from 'react';
import { supabase } from '../../services/supabase';
import { 
  Box, TextField, Button, Typography, Avatar, 
  Paper, Divider, Alert, CircularProgress 
} from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import EmailIcon from '@mui/icons-material/Email';
import BadgeIcon from '@mui/icons-material/Badge';
import PhotoCamera from '@mui/icons-material/PhotoCamera';

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
  const [profilePicture, setProfilePicture] = useState(null);

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
      let profilePictureUrl = profile.profile_picture;

      if (profilePicture) {
        const fileExt = profilePicture.name.split('.').pop();
        const fileName = `${user.id}_${Date.now()}.${fileExt}`;
        const filePath = `profiles/${fileName}`;

        const { error: uploadError } = await supabase
          .storage
          .from('bikeshare')
          .upload(filePath, profilePicture, { upsert: false });

        if (uploadError) throw uploadError;

        const { data } = supabase.storage
          .from('bikeshare')
          .getPublicUrl(filePath);

        profilePictureUrl = data.publicUrl;
      }

      const { error } = await supabase
        .from('user')
        .update({
          name: formData.name,
          dni: formData.dni,
          profile_picture: profilePictureUrl
        })
        .eq('id', user.id);

      if (error) throw error;

      setProfile(prev => ({
        ...prev,
        name: formData.name,
        dni: formData.dni,
        profile_picture: profilePictureUrl
      }));

      setEditing(false);

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleProfilePictureChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setProfilePicture(e.target.files[0]);
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
      <Paper elevation={3} sx={{ p: 4, borderRadius: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <Avatar
            src={profile.profile_picture}
            sx={{ 
              width: 100, 
              height: 100, 
              bgcolor: 'primary.main',
              fontSize: '2.5rem'
            }}
          >
            {!profile.profile_picture && (profile.name?.charAt(0) || <PersonIcon fontSize="large" />)}
          </Avatar>
          <Box sx={{ ml: 3 }}>
            <Typography variant="h4" sx={{ fontWeight: 700 }}>
              {profile.name || 'Usuario'}
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
              <EmailIcon sx={{ fontSize: 18, mr: 1 }} />
              {profile.email}
            </Typography>
            <Typography 
              variant="body2" 
              sx={{ 
                mt: 1,
                bgcolor: 'primary.light',
                px: 1.5,
                py: 0.5,
                borderRadius: 1,
                display: 'inline-block',
                color: 'white',
                fontWeight: 500
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
              sx={{ mb: 3 }}
            />
            <TextField
              fullWidth
              label="DNI"
              value={formData.dni}
              onChange={(e) => setFormData(prev => ({ ...prev, dni: e.target.value }))}
              sx={{ mb: 3 }}
              InputProps={{
                startAdornment: (
                  <BadgeIcon sx={{ mr: 1, color: 'text.secondary' }} />
                ),
              }}
            />
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
              <Button variant="contained" component="label" startIcon={<PhotoCamera />}>
                Subir Foto
                <input type="file" hidden accept="image/*" onChange={handleProfilePictureChange} />
              </Button>
              {profilePicture && (
                <Typography variant="body2" color="text.secondary" sx={{ ml: 2 }}>
                  {profilePicture.name}
                </Typography>
              )}
            </Box>
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
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
            <Typography variant="h6" color="text.secondary" gutterBottom>
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