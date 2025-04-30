import { Box, Typography, Button, List, ListItem, ListItemIcon, ListItemText } from '@mui/material';
import CheckIcon from '@mui/icons-material/Check';

const videoUrl = "/inicio.mp4"; // Cambia esto por la ruta de tu vídeo en public

const Home = () => (
  <Box sx={{ width: '100%', minHeight: '100vh', position: 'relative' }}>
    {/* Carrusel de video con texto superpuesto */}
    <Box
      sx={{
        position: 'relative',
        width: '100vw', // Ocupa todo el ancho de la ventana
        left: '50%',
        right: '50%',
        marginTop: '-2vw',
        marginLeft: '-50vw',
        marginRight: '-50vw',
        height: { xs: '60vh', md: '80vh' },
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
      }}
    >
      <video
        src={videoUrl}
        autoPlay
        loop
        muted
        playsInline
        style={{
          width: '100vw',
          height: '100%',
          objectFit: 'cover',
          position: 'absolute',
          top: 0,
          left: 0,
          zIndex: 1,
        }}
      />
      {/* Capa oscura para mejorar contraste del texto */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100%',
          zIndex: 2,
        }}
      />
      {/* Texto superpuesto */}
      <Box
        sx={{
          position: 'relative',
          zIndex: 3,
          color: 'white',
          textAlign: 'center',
          width: '100vw',
          px: 2,
        }}
      >
        <Typography
          variant="h2"
          sx={{
            fontWeight: 'bold',
            color: 'white',
            textShadow: '0 4px 24px rgba(0,0,0,0.7)',
            mb: 2,
            fontSize: { xs: '2rem', md: '3.5rem' }
          }}
        >
          NUNCA TE QUEDES SIN BICI
        </Typography>
        <Typography
          variant="h5"
          sx={{
            color: 'white',
            textShadow: '0 2px 12px rgba(0,0,0,0.7)',
            fontSize: { xs: '1rem', md: '1.5rem' }
          }}
        >
          BIKESHARE LA BICICLETA COMPARTIDA MEJOR VALORADA DE LA CIUDAD
        </Typography>
      </Box>
    </Box>

    {/* Sección informativa */}
    <Box
      sx={{
        pt: '64px', // Si necesitas espacio para el header
        display: 'flex',
        flexDirection: { xs: 'column', md: 'row' },
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        px: { xs: 2, md: 8 },
        py: { xs: 6, md: 10 },
        bgcolor: 'white',
      }}
    >
      {/* ...resto del contenido... */}
      {/* Texto y pasos */}
      <Box sx={{ flex: 1, minWidth: 300 }}>
        <Typography variant="h3" sx={{ fontWeight: 700, color: '#232733', mb: 2 }}>
          Cómo ir en una bicicleta Bikeshare
        </Typography>
        <Typography sx={{ color: '#232733', mb: 3 }}>
          Tu viaje comienza con unos pocos toques. Usa la aplicación Bikeshare para encontrar la bicicleta más cercana, desbloquéala al instante y comienza a explorar. ¿Necesitas un descanso? Bloquea la bicicleta y continúa tu viaje más tarde.
        </Typography>
        <List>
          <ListItem sx={{ pl: 0 }}>
            <ListItemIcon sx={{ minWidth: 36 }}>
              <CheckIcon sx={{ color: '#ff6600' }} />
            </ListItemIcon>
            <ListItemText primary="Encuentra una bicicleta en la aplicación" />
          </ListItem>
          <ListItem sx={{ pl: 0 }}>
            <ListItemIcon sx={{ minWidth: 36 }}>
              <CheckIcon sx={{ color: '#ff6600' }} />
            </ListItemIcon>
            <ListItemText primary="Desbloquear la bicicleta" />
          </ListItem>
          <ListItem sx={{ pl: 0 }}>
            <ListItemIcon sx={{ minWidth: 36 }}>
              <CheckIcon sx={{ color: '#ff6600' }} />
            </ListItemIcon>
            <ListItemText primary="Viaja todo el tiempo que quieras" />
          </ListItem>
          <ListItem sx={{ pl: 0 }}>
            <ListItemIcon sx={{ minWidth: 36 }}>
              <CheckIcon sx={{ color: '#ff6600' }} />
            </ListItemIcon>
            <ListItemText primary="Deja la bicicleta dentro de una zona de aparcamiento" />
          </ListItem>
        </List>
        <Button
          variant="contained"
          sx={{
            mt: 4,
            px: 4,
            py: 1.5,
            background: 'linear-gradient(90deg, #ff6600 0%, #ff9900 100%)',
            color: 'white',
            fontWeight: 700,
            fontSize: '1.1rem',
            borderRadius: 999,
            boxShadow: '0 2px 8px rgba(255,102,0,0.15)',
            textTransform: 'none',
            '&:hover': {
              background: 'linear-gradient(90deg, #ff9900 0%, #ff6600 100%)',
            },
          }}
        >
          Consigue la aplicación
        </Button>
      </Box>
      {/* Imagen de ejemplo */}
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minWidth: 300,
        }}
      >
        <Box
          component="img"
          src="/appbikeshare.png" // Cambia esto por la imagen que quieras mostrar
          alt="App Bikeshare"
        />
      </Box>
    </Box>
  </Box>
);

export default Home;