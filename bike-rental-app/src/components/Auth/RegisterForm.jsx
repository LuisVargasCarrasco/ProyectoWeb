import { useState } from 'react';
import { supabase } from '../../services/supabase';
import { Box, TextField, Button, Typography, InputAdornment } from '@mui/material';
import EmailIcon from '@mui/icons-material/Email';
import LockIcon from '@mui/icons-material/Lock';
import PersonIcon from '@mui/icons-material/Person';

const RegisterForm = ({ onToggleForm }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');

  const handleRegister = async (e) => {
    e.preventDefault();
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name: name,
        }
      }
    });
    if (error) {
      alert(error.message);
    } else {
      alert('Revisa tu email para confirmar el registro');
    }
  };

  return (
    <Box 
      component="form" 
      onSubmit={handleRegister} 
      sx={{ 
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 3,
        width: '100%',
        maxWidth: 400,
        bgcolor: 'rgba(46, 125, 50, 0.03)',
        p: 4,
        borderRadius: 4,
      }}
    >
      <Box
        component="img"
        src="/logobikeshare.jpg"
        alt="BikeShare Logo"
        sx={{
          width: 200,
          height: 'auto',
          borderRadius: 2,
          mb: 2,
        }}
      />
      
      <Typography 
        variant="h4" 
        component="h1" 
        sx={{ 
          color: '#2E7D32',
          fontWeight: 700,
          mb: 3,
          textAlign: 'center',
        }}
      >
        Crear Cuenta
      </Typography>

      <TextField
        required
        fullWidth
        label="Nombre"
        value={name}
        onChange={(e) => setName(e.target.value)}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <PersonIcon sx={{ color: '#2E7D32' }} />
            </InputAdornment>
          ),
        }}
        sx={{
          '& .MuiOutlinedInput-root': {
            borderRadius: 2,
            backgroundColor: 'white',
            '&:hover fieldset': {
              borderColor: '#2E7D32',
            },
            '&.Mui-focused fieldset': {
              borderColor: '#2E7D32',
            }
          },
          '& .MuiInputLabel-root.Mui-focused': {
            color: '#2E7D32'
          }
        }}
      />

      <TextField
        required
        fullWidth
        label="Email"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <EmailIcon sx={{ color: '#2E7D32' }} />
            </InputAdornment>
          ),
        }}
        sx={{
          '& .MuiOutlinedInput-root': {
            borderRadius: 2,
            backgroundColor: 'white',
            '&:hover fieldset': {
              borderColor: '#2E7D32',
            },
            '&.Mui-focused fieldset': {
              borderColor: '#2E7D32',
            }
          },
          '& .MuiInputLabel-root.Mui-focused': {
            color: '#2E7D32'
          }
        }}
      />

      <TextField
        required
        fullWidth
        label="Contraseña"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <LockIcon sx={{ color: '#2E7D32' }} />
            </InputAdornment>
          ),
        }}
        sx={{
          '& .MuiOutlinedInput-root': {
            borderRadius: 2,
            backgroundColor: 'white',
            '&:hover fieldset': {
              borderColor: '#2E7D32',
            },
            '&.Mui-focused fieldset': {
              borderColor: '#2E7D32',
            }
          },
          '& .MuiInputLabel-root.Mui-focused': {
            color: '#2E7D32'
          }
        }}
      />

      <Button
        type="submit"
        fullWidth
        variant="contained"
        sx={{ 
          mt: 2,
          py: 1.5,
          borderRadius: 2,
          textTransform: 'none',
          fontSize: '1.2rem',
          fontWeight: 600,
          backgroundColor: '#2E7D32',
          '&:hover': {
            backgroundColor: '#1B5E20',
            transform: 'translateY(-2px)',
          },
          transition: 'all 0.3s ease-in-out',
        }}
      >
        Registrarse
      </Button>

      <Button
        onClick={onToggleForm}
        sx={{ 
          color: '#2E7D32',
          textTransform: 'none',
          '&:hover': {
            backgroundColor: 'transparent',
            textDecoration: 'underline',
          }
        }}
      >
        ¿Ya tienes cuenta? Inicia sesión
      </Button>
    </Box>
  );
};

export default RegisterForm;