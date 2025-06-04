const express = require('express');
const path = require('path');
const db = require('./db/database.js'); // Ensures DB is initialized and connected

// Import routes
const authRoutes = require('./routes/authRoutes');
const resourceRoutes = require('./routes/resourceRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json()); // Parses incoming requests with JSON payloads
app.use(express.urlencoded({ extended: true })); // Parses incoming requests with URL-encoded payloads

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// Serve uploaded files statically from the 'uploads' directory
// This allows direct access to uploaded files, e.g., for download or display if needed.
// Consider security implications if files are sensitive and direct access is not desired.
// For this project, download is handled via a specific route, but this can be useful.
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));


// API Routes
app.use('/auth', authRoutes);
app.use('/resources', resourceRoutes);

// Root route - serves index.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Basic Global Error Handler
// This should be the last piece of middleware
app.use((err, req, res, next) => {
    console.error("Global Error Handler Caught:", err.stack);
    res.status(err.status || 500).json({
        message: err.message || 'An unexpected error occurred.',
        // In development, you might want to send the stack trace
        // stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
});

// 404 Handler for undefined routes
app.use((req, res, next) => {
    res.status(404).sendFile(path.join(__dirname, 'public', '404.html'), (err) => {
        // If 404.html doesn't exist, send a simple text response
        if (err) {
            res.status(404).json({ message: "Resource not found at " + req.originalUrl });
        }
    });
});


app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
    // The database connection message will be printed by database.js
});

module.exports = app; // Export for potential testing
