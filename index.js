const express = require('express');
const path = require('path'); // Import the path module
const app = express();
const port = 3000;

// Serve static files from the 'public' directory (for assets)
app.use(express.static(path.join(__dirname, 'public')));

// Serve static files from the 'web' directory (for HTML files)
app.use(express.static(path.join(__dirname, 'web'))); // Changed from root

// Serve compiled static files from the 'dist' directory
app.use('/dist', express.static(path.join(__dirname, 'dist')));

// Route for the input test page
app.get('/input-manager-test', (req, res) => {
    res.sendFile(path.join(__dirname, 'web', 'input-manager-test.html')); // Added 'web'
});

// Route for the asset loader test page
app.get('/asset-loader-test', (req, res) => {
    res.sendFile(path.join(__dirname, 'web', 'asset-loader-test.html')); // Added 'web'
});

// Route for the sprite demo page
app.get('/sprite-demo', (req, res) => {
    res.sendFile(path.join(__dirname, 'web', 'sprite-demo.html')); // Added 'web'
});

// Route for the main menu demo page
app.get('/main-menu-demo', (req, res) => {
    res.sendFile(path.join(__dirname, 'web', 'main-menu-demo.html')); // Added 'web'
});

// Route for the advanced sprite demo page
app.get('/advanced-sprite-demo', (req, res) => {
    res.sendFile(path.join(__dirname, 'web', 'advanced-sprite-demo.html')); // Added 'web'
});

// Updated root route to serve the main index.html from 'web'
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'web', 'index.html')); // Added 'web'
});


app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}/`);
    console.log('Serving compiled JS from ./dist directory.');
    console.log('Serving HTML from ./web directory.'); // Updated log message
    console.log('Navigate to http://localhost:3000/'); // Root serves index now
    console.log('Navigate to http://localhost:3000/main-menu-demo');
    console.log('Navigate to http://localhost:3000/advanced-sprite-demo');
});
