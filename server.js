const session = require('express-session');
const express = require('express');
const path = require('path');
require('dotenv').config();

const app = express();
const routes = require('./server/routes');

app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));

/* Page routes */
app.get('/', (req, res) =>
  res.sendFile(path.join(__dirname, 'views/index.html'))
);

app.get('/about', (req, res) =>
  res.sendFile(path.join(__dirname, 'views/about.html'))
);

app.get('/solutions', (req, res) =>
  res.sendFile(path.join(__dirname, 'views/solutions.html'))
);

app.get('/projects', (req, res) =>
  res.sendFile(path.join(__dirname, 'views/projects.html'))
);

app.get('/contact', (req, res) =>
  res.sendFile(path.join(__dirname, 'views/contact.html'))
);

app.use(session({
  secret: 'telmex-admin-secret',
  resave: false,
  saveUninitialized: false
}));


/* Form routes */
app.use('/', routes);

app.get('/success', (req, res) => {
  res.sendFile(path.join(__dirname, 'views/success.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Telmex site running on http://localhost:${PORT}`);
});
