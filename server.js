const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Root endpoint - Railway checks this to know server is alive
app.get('/', (req, res) => {
    res.json({ 
        status: 'running',
        message: 'Israeli Vehicle API',
        version: '1.0.0'
    });
});

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
});

// Vehicle search endpoint
app.get('/api/vehicle/:plateNumber', async (req, res) => {
    const plateNumber = req.params.plateNumber;
    
    console.log('Searching for:', plateNumber);
    
    try {
        const response = await axios.get('https://data.gov.il/api/3/action/datastore_search', {
            params: {
                resource_id: '053cea08-09bc-40ec-8f7a-156f0677aff3',
                q: plateNumber,
                limit: 1
            },
            timeout: 10000
        });
        
        if (response.data && response.data.success) {
            if (response.data.result && response.data.result.records && response.data.result.records.length > 0) {
                return res.json({
                    success: true,
                    data: response.data.result.records[0]
                });
            } else {
                return res.json({
                    success: false,
                    message: 'No vehicle found'
                });
            }
        } else {
            return res.status(500).json({
                success: false,
                message: 'API error'
            });
        }
    } catch (error) {
        console.error('Error:', error.message);
        return res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
});

// Start server
app.listen(PORT, () => {
    console.log('Server started on port', PORT);
});
