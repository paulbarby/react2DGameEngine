const express = require('express');
const path = require('path'); // Import the path module
const app = express();
const port = 3000;

// Serve static files from the 'public' directory (for assets)
app.use(express.static(path.join(__dirname, 'public')));

// Serve static files from the root directory (for HTML files)
app.use(express.static(path.join(__dirname)));

// Serve compiled static files from the 'dist' directory
app.use('/dist', express.static(path.join(__dirname, 'dist')));

// Route for the input test page
app.get('/input-manager-test', (req, res) => {
    res.sendFile(path.join(__dirname, 'input-manager-test.html'));
});

// Route for the asset loader test page
app.get('/asset-loader-test', (req, res) => {
    res.sendFile(path.join(__dirname, 'asset-loader-test.html'));
});

// Route for the sprite demo page
app.get('/sprite-demo', (req, res) => {
    res.sendFile(path.join(__dirname, 'sprite-demo.html'));
});

// Updated root route to serve the main index.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});


app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}/`);
    console.log('Serving compiled JS from ./dist directory.');
    console.log('Navigate to http://localhost:3000/input-manager-test');
    console.log('Navigate to http://localhost:3000/asset-loader-test');
    console.log('Navigate to http://localhost:3000/sprite-demo');
});
