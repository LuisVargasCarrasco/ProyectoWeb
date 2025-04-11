import { useState } from 'react';
import { supabase } from '../../services/supabase';
import { Box, TextField, Button, Typography, InputAdornment, Link } from '@mui/material';
import EmailIcon from '@mui/icons-material/Email';
import LockIcon from '@mui/icons-material/Lock';
import { motion } from 'framer-motion';

const LoginForm = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isRegistering) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
        alert('Revisa tu email para confirmar el registro');
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
      }
    } catch (error) {
      alert(error.message);
    }
  };
 
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Box
        sx={{
          minHeight: '100vh', // Asegura que el contenedor ocupe toda la altura de la ventana
          width: '100vw', // Asegura que el contenedor ocupe todo el ancho de la ventana
          display: 'flex',
          justifyContent: 'center', // Centra el formulario horizontalmente
          alignItems: 'center', // Centra el formulario verticalmente
          backgroundImage: 'url(/login-register.jpg)', // Ruta de la imagen
          backgroundSize: 'cover', // Ajusta la imagen para cubrir todo el fondo
          backgroundPosition: 'center', // Centra la imagen en el fondo
          backgroundRepeat: 'no-repeat', // Evita que la imagen se repita
        }}
      >
        <Box
          component="form"
          onSubmit={handleSubmit}
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 3,
            width: '100%',
            maxWidth: 400,
            bgcolor: 'white',
            p: 4,
            borderRadius: 1,
            boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
          }}
        >
          <Box
            component="img"
            src="/logobikeshare.jpg"
            alt="BikeShare Logo"
            sx={{
              width: 180,
              height: 'auto',
              borderRadius: 2,
            }}
          />

          <Typography
            variant="h4"
            component="h1"
            sx={{
              color: '#2E7D32',
              fontWeight: 700,
              textAlign: 'center',
            }}
          >
            {isRegistering ? 'Crear cuenta' : 'Bienvenido'}
          </Typography>

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
                },
              },
              '& .MuiInputLabel-root.Mui-focused': {
                color: '#2E7D32',
              },
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
                },
              },
              '& .MuiInputLabel-root.Mui-focused': {
                color: '#2E7D32',
              },
            }}
          />

          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{
              py: 1.5,
              borderRadius: 2,
              fontSize: '1.1rem',
              fontWeight: 600,
              backgroundColor: '#2E7D32',
              '&:hover': {
                backgroundColor: '#1B5E20',
                transform: 'translateY(-2px)',
              },
              transition: 'all 0.3s ease-in-out',
            }}
          >
            {isRegistering ? 'Registrarse' : 'Iniciar Sesión'}
          </Button>

          <Link
            component="button"
            variant="body2"
            onClick={() => setIsRegistering(!isRegistering)}
            sx={{
              color: '#2E7D32',
              textDecoration: 'none',
              '&:hover': {
                textDecoration: 'underline',
              },
            }}
          >
            {isRegistering ? '¿Ya tienes cuenta? Inicia sesión' : '¿No tienes cuenta? Regístrate'}
          </Link>
        </Box>
      </Box>
    </motion.div>
  );
};

export default LoginForm;