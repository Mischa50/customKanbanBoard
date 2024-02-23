/* 
Author: Mischa Barmettler
Date: 23.02.2024
Version: 1.0
Description: Kanban-Board
*/


const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcrypt');
const mysql = require('mysql');

// Assuming you have a mysql connection pool already configured
const pool = mysql.createPool({
    connectionLimit:  10,
    host           : 'localhost',
    port           :  6033,
    user           : 'admin',
    password       : '12345',
    database       : 'kanbanDB'
});

function initialize(passport, getUserByEmail) {
  const authenticateUser = async (email, password, done) => {
    try {
      const user = await getUserByEmail(email);
      if (!user) {
        return done(null, false, { message: 'No user with that email' });
      }

      if (await bcrypt.compare(password, user.password)) {
        return done(null, user);
      } else {
        return done(null, false, { message: 'Password incorrect' });
      }
    } catch (e) {
      return done(e);
    }
  };

  passport.use(new LocalStrategy({ usernameField: 'email' }, authenticateUser));

  passport.serializeUser((user, done) => done(null, user.id));

  passport.deserializeUser((id, done) => {
    const sqlSelect = 'SELECT * FROM user WHERE id = ?';
    pool.query(sqlSelect, [id], (error, results) => {
      if (error) {
        return done(error);
      }
      // Assuming the user exists in the database
      if (results && results.length >  0) {
        return done(null, results[0]);
      } else {
        return done(new Error('User not found'));
      }
    });
  });
}

module.exports = initialize;
