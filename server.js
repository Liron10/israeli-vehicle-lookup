// server.js - Israeli Vehicle API Backend
const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3000;

// Enable CORS
app.use(cors());
app.use(express.json());

// Root endpoint - shows API is working
app.get('/', (req, res) => {
    res.json({ 
        status: 'running',
        message: 'Israeli Vehicle API is live! 🚗',
        endpoints: {
            health: '/health',
            search: '/api/vehicle/:plateNumber',
            example: '/api/vehicle/60570703'
        }
    });
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

// API endpoint to search vehicle by plate number
app.get('/api/vehicle/:plateNumber', async (req, res) => {
    const plateNumber = req.params.plateNumber;
    
    // Validate plate number
    if (!plateNumber || plateNumber.length < 7 || plateNumber.length > 8) {
        return res.status(400).json({
            success: false,
            message: 'מספר רישוי לא תקין. נדרש 7-8 ספרות'
        });
    }

    // Remove non-numeric characters
    const cleanPlate = plateNumber.replace(/[^0-9]/g, '');

    try {
        console.log(`🔍 Searching for plate: ${cleanPlate}`);
        
        // Call the Israeli government API
        const response = await axios.get('https://data.gov.il/api/3/action/datastore_search', {
            params: {
                resource_id: '053cea08-09bc-40ec-8f7a-156f0677aff3',
                q: cleanPlate,
                limit: 1
            },
            timeout: 15000,
            headers: {
                'Accept': 'application/json',
                'User-Agent': 'Israeli-Vehicle-Lookup/1.0'
            }
        });
        
        // Check if API returned data
        if (response.data && response.data.success) {
            if (response.data.result && response.data.result.records && response.data.result.records.length > 0) {
                // Found the vehicle!
                const vehicle = response.data.result.records[0];
                console.log(`✅ Vehicle found: ${vehicle.mispar_rechev || cleanPlate}`);
                
                return res.json({
                    success: true,
                    data: vehicle
                });
            } else {
                // No records found
                console.log(`❌ No records found for: ${cleanPlate}`);
                return res.json({
                    success: false,
                    message: 'לא נמצאו נתונים עבור מספר רישוי זה במאגר'
                });
            }
        } else {
            // API returned error
            console.error('❌ API returned unsuccessful response');
            return res.status(500).json({
                success: false,
                message: 'שגיאה בתגובה מהמאגר הממשלתי'
            });
        }
        
    } catch (error) {
        console.error('❌ Error fetching data:', error.message);
        
        // Handle different error types
        if (error.code === 'ECONNABORTED') {
            return res.status(504).json({
                success: false,
                message: 'חיבור למאגר הממשלתי נכשל (timeout)'
            });
        } else if (error.response) {
            // The request was made and the server responded with a status code
            return res.status(error.response.status).json({
                success: false,
                message: 'שגיאה בחיבור למאגר הממשלתי',
                details: error.response.statusText
            });
        } else if (error.request) {
            // The request was made but no response was received
            return res.status(503).json({
                success: false,
                message: 'לא התקבלה תגובה מהמאגר הממשלתי'
            });
        } else {
            // Something else happened
            return res.status(500).json({
                success: false,
                message: 'שגיאה פנימית בשרת',
                error: error.message
            });
        }
    }
});

// 404 handler for undefined routes
app.use((req, res) => {
    res.status(404).json({
        error: 'Not Found',
        message: `Endpoint ${req.url} not found`,
        availableEndpoints: {
            root: '/',
            health: '/health',
            search: '/api/vehicle/:plateNumber'
        }
    });
});

// Error handler
app.use((err, req, res, next) => {
    console.error('💥 Server error:', err);
    res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: err.message
    });
});

// Start server
const server = app.listen(PORT, '0.0.0.0', () => {
    console.log('🚀 Israeli Vehicle API Server Started');
    console.log(`📍 Port: ${PORT}`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`✅ Server is ready to accept connections`);
});

// Handle server errors
server.on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
        console.error(`❌ Port ${PORT} is already in use`);
        process.exit(1);
    } else {
        console.error('❌ Server error:', error);
        process.exit(1);
    }
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('🛑 SIGTERM received. Shutting down gracefully...');
    server.close(() => {
        console.log('✅ Server closed');
        process.exit(0);
    });
});

process.on('SIGINT', () => {
    console.log('🛑 SIGINT received. Shutting down gracefully...');
    server.close(() => {
        console.log('✅ Server closed');
        process.exit(0);
    });
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
    console.error('💥 Uncaught Exception:', error);
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
});

module.exports = app;
