var express = require('express');
const bcrypt = require('bcryptjs');
var router = express.Router();
const User = require('../models/user');  // Importa el modelo User
const Badge = require('../models/badge');

// Función para verificar si el nombre de usuario es único
async function isUsernameUnique(username) {
  const user = await User.findOne({ username: username.toLowerCase() });
  return !user;
}

// Función para obtener el número de usuarios en la base de datos
async function getUserCount() {
  const count = await User.countDocuments();
  return count;
}

//GET /users/register
/*router.get('/register', (req, res) => {

  const success_msg = req.query.success_msg || '';
  const error_msg = req.query.error_msg || '';
  const error = req.query.error || '';

    res.render('register', { success_msg, error_msg, error });
});*/


// POST /users/register
router.post('/register', async (req, res) => {
  const { username, password, password2 } = req.body;

  // Validaciones
  if (!username || !password || !password2) {
    //return res.render('register', { error: 'Todos los campos son obligatorios.' });
    return res.redirect('/users/register?error_msg=All fields are required');
  }

  const passwordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>]).+$/;

  if (!passwordRegex.test(password)) {
    //return res.render('register', { error: 'La contraseña debe contener al menos una letra mayúscula, un número y un carácter especial' });
    return res.redirect('/users/register?error_msg=Password must contain at least one uppercase letter, one number and one special character');
  }

  if (password !== password2) {
   // return res.render('register', { error: 'Las contraseñas no coinciden.' });
    return res.redirect('/users/register?error_msg=Passwords do not match');
  }
  if (password.length < 6) {
    //return res.render('register', { error: 'La contraseña debe tener al menos 6 caracteres.' });
    return res.redirect('/users/register?error_msg=Password must be at least 6 characters long');
  }

  // Verificar si el nombre de usuario ya existe
  const isUnique = await isUsernameUnique(username);
  if (!isUnique) {
    res.render('login', {
      success_msg: '',
      error_msg: 'Username already in use',
      error: '',
    });

    return;
  }

  try {
    // Verificar si es el primer usuario
    const userCount = await getUserCount();
    const admin = userCount === 0;  // El primer usuario registrado será un administrador
    const newUser = new User({ username: username.toLowerCase(), password, admin });
    await newUser.save();

    // Iniciar la sesión del usuario
    // Almacenar el usuario en la sesión
    req.session.user = {
      id: newUser._id,
      username: newUser.username,
      admin: newUser.admin // Guardar la propiedad 'admin' en la sesión
    };

    res.redirect('/skills?success_msg=You have registered successfully');

  } catch (err) {
    console.error(err);
    //res.render('register', { error: 'Hubo un error al registrar al usuario.' });
    res.redirect('/users/register?error_msg=An error occurred registering the user');
  }
});

// POST /users/login
router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  // Verificar que ambos campos estén presentes
  if (!username || !password) {
   // return res.render('login', { error: 'Por favor, ingresa tu nombre de usuario y contraseña.' });
    return res.redirect('/users/login?error_msg=Please enter your username and password');
  }

  try {
    // Buscar el usuario en la base de datos
    const user = await User.findOne({ username: username.toLowerCase() });
    if (!user) {
     // return res.render('login', { error: 'Usuario no encontrado.' });
        return res.redirect('/users/login?error_msg=User not found');
    }

    // Comparar las contraseñas utilizando bcrypt
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      //return res.render('login', { error: 'Contraseña incorrecta.' });
        return res.redirect('/users/login?error_msg=Incorrect password ');
    }

    // Iniciar la sesión del usuario
    // Almacenar el usuario en la sesión
    req.session.user = {
      id: user._id,
      username: user.username,
      admin: user.admin // Guardar la propiedad 'admin' en la sesión
    };

    res.redirect('/skills?success_msg=You have logged in successfully');

  } catch (err) {
    console.error(err);
    //res.status(500).send('Error del servidor.');
    res.redirect('/users/login?error=Server error');
  }
});



// Endpoint para cerrar sesión
router.get('/logout', (req, res) => {
  if (req.session) {
    // Destruye la sesión
    //req.session.mensajeLogout = 'You have logged out successfully.';

    const success_msg = req.query.success_msg || '';
    const error_msg = req.query.error_msg || '';
    const error = req.query.error || '';

    req.session.destroy(err => {
      if (err) {
        console.error("Error al cerrar sesión: ", err);
        res.redirect('/skills'); // Redirigir a la página principal en caso de error
      }else{
        //res.redirect('/users/login?mensajeLogout=You+have+logged+out+successfully.');
        res.redirect('/users/login?success_msg=You have logged out successfully');
      }
    });
  } else {
    res.redirect('users/login');
  }
});

//GET /users/leaderboard
/**router.get('/leaderboard', async (req, res)=>{
  const Badge = req.Badge;
  try {
    const badges = await Badge.find();
    // Obtén todos los usuarios desde la base de datos
    const users = await User.find();
    // Renderiza la vista leaderboard.ejs y pasa los usuarios como datos , { users: users }
    res.render('leaderboard', {badges});
  } catch (error) {
    console.error('Error fetching badges:', error);
    res.status(500).send('Error fetching badges!');
  }
});**/

/*router.get('/leaderboard', async (req, res) => {
  try {
    const users = await User.find();

    res.render('leaderboard', {
      title: 'Welcome, ' + req.session.user.username,
      username: req.session.user.username, // Pass username to the template
      id: req.session.user._id,
      isAdmin: req.session.user.admin || false,
      users,
    });
  } catch (error) {
    console.error('Error loading leaderboard:', error);
    res.status(500).send('Error loading leaderboard');
  }
});*/


router.get('/api/users', async (req, res) => {
  const User = req.User;
  try {
    const users = await User.find(); // Obtén los usuarios desde la base de datos
    res.json(users); // Devuelve los usuarios en formato JSON
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).send('Error fetching users');
  }
});

router.get('/leaderboard', async (req, res) => {
  if (!req.session.user) {
    return res.redirect('/users/login');
  }

  try {
    const badges = await Badge.find().sort({ bitpoints_min: 1 });
    const users = await User.find();

    res.render('users-leaderboard', {
      title: 'Welcome, ' + req.session.user.username,
      username: req.session.user.username, // Pass username to the template
      id: req.session.user.id,
      isAdmin: req.session.user.admin || false,
      badges,
      users
    });
  } catch (error) {
    console.error('Error loading leaderboard:', error);
    res.status(500).send('Error loading leaderboard');
  }
});


router.get('/current-user', (req, res) => {
  if (req.session.user) {
    res.json({ username: req.session.user.username });
  } else {
    res.status(401).json({ error: 'Not logged in' });
  }
});

router.get('/api/user/evidences', async (req, res) => {
  try {
    const UserSkill = require('../models/userSkill');
    const userId = req.session.user.id; // Use session user ID
    const evidences = await UserSkill.find({ user: userId }).select('skill evidence verified');
    res.json(evidences);
  } catch (error) {
    console.error('Error fetching user evidences:', error);
    res.status(500).json({ message: 'Error fetching user evidences' });
  }
});

module.exports = router;