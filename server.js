if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

const express = require('express');
const app = express();
const bcrypt = require('bcrypt');
const passport = require('passport');
const flash = require('express-flash');
const session = require('express-session');
const methodOverride = require('method-override');
const mysql = require('mysql');

const initializePassport = require('./passport-config');

const pool = mysql.createPool({
  connectionLimit:   10,
  host           : 'localhost',
  port           :   6033,
  user           : 'admin',
  password       : '12345',
  database       : 'kanbanDB'
});

initializePassport(
  passport,
  email => {
    return new Promise((resolve, reject) => {
      const sqlSelect = 'SELECT * FROM user WHERE email = ?';
      pool.query(sqlSelect, [email], (error, results) => {
        if (error) reject(error);
        resolve(results[0]);
      });
    });
  },
  id => {
    return new Promise((resolve, reject) => {
      const sqlSelect = 'SELECT * FROM user WHERE id = ?';
      pool.query(sqlSelect, [id], (error, results) => {
        if (error) reject(error);
        resolve(results[0]);
      });
    });
  }
);

app.use(express.static('public'));

app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(flash());
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(methodOverride('_method'));

app.get('/', checkAuthenticated, (req, res) => {
  res.render('index.ejs', { name: req.user.name });
});

app.delete("/logout", (req, res) => {
  req.logout(function (err) {
    if (err) {
      return next(err);
    }
    res.redirect("/login");
  });
});

app.get('/login', checkNotAuthenticated, (req, res) => {
  res.render('login.ejs');
});

app.post('/login', checkNotAuthenticated, passport.authenticate('local', {
  successRedirect: '/',
  failureRedirect: '/login',
  failureFlash: true
}));

app.get('/register', checkNotAuthenticated, (req, res) => {
  res.render('register.ejs');
});

app.post('/register', checkNotAuthenticated, async (req, res) => {
  try {
    const hashedPassword = await bcrypt.hash(req.body.password,   10);
    const sqlInsert = 'INSERT INTO user (name, email, password) VALUES (?, ?, ?)';
    const values = [req.body.name, req.body.email, hashedPassword];

    pool.query(sqlInsert, values, (error, results) => {
      if (error) return console.log(error);
      res.redirect('/login');
    });
  } catch {
    res.redirect('/register');
  }
});

// Add an endpoint to handle task creation
app.post('/tasks', checkAuthenticated, (req, res) => {
  // Extract task data from the request body
  const content = req.body.content;
  // Perform database insertion with the logged-in user's ID
  const userId = req.user.id;
  const sqlInsert = 'INSERT INTO tasks (user_id, content) VALUES (?, ?)';
  pool.query(sqlInsert, [userId, content], (error, results) => {
      if (error) {
          console.error('Error saving task:', error);
          res.status(500).send('Error saving task');
      } else {
          res.status(201).send('Task saved successfully');
      }
  });
});

// Add an endpoint to retrieve tasks for the authenticated user
app.get('/api/tasks', checkAuthenticated, (req, res) => {
  const userId = req.user.id;
  const sqlSelect = 'SELECT * FROM tasks WHERE user_id = ?';
  pool.query(sqlSelect, [userId], (error, results) => {
    if (error) {
      console.error('Error retrieving tasks:', error);
      res.status(500).send('Error retrieving tasks');
    } else {
      res.json(results);
    }
  });
});

app.delete('/logout', (req, res) => {
  req.logOut();
  res.redirect('/login');
});

function checkAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }

  res.redirect('/login');
}

function checkNotAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return res.redirect('/');
  }
  next();
}

// Example for the home route ('/')
app.get('/', checkAuthenticated, (req, res) => {
  // Pass the user object to the view
  res.render('index.html', { user: req.user });
});

app.listen(3000);
