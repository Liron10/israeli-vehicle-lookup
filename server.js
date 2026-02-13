const express = require('express');
const cors = require('cors');
const axios = require('axios');
 
const app = express();
const PORT = process.env.PORT || 3000;
 
// Middleware
app.use(cors());
app.use(express.json());
 
// Helpers
function normalizePlate(input) {
  if (input === undefined || input === null) return '';
  // keep digits only (handles spaces, dashes, etc.)
  return String(input).replace(/\D/g, '');
}
 
// Root endpoint - Railway checks this to know server is alive
app.get('/', (req, res) => {
  res.json({
    status: 'running',
    message: 'Israeli Vehicle API',
    version: '1.0.1'
  });
});
 
// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});
 
// Vehicle search endpoint (exact match by plate)
app.get('/api/vehicle/:plateNumber', async (req, res) => {
  const rawPlate = req.params.plateNumber;
  const plateNumber = normalizePlate(rawPlate);
 
  console.log('Searching for:', { rawPlate, plateNumber });
 
  if (!plateNumber) {
    return res.status(400).json({
      success: false,
      message: 'Invalid plate number'
    });
  }
 
  try {
    const response = await axios.get('https://data.gov.il/api/3/action/datastore_search', {
      params: {
        resource_id: '053cea08-09bc-40ec-8f7a-156f0677aff3',
        // IMPORTANT: exact match by field
        filters: JSON.stringify({
          mispar_rechev: plateNumber
        }),
        limit: 1
      },
      timeout: 10000
    });
 
    if (response.data && response.data.success) {
      const records = response.data.result?.records || [];
 
      if (records.length > 0) {
        return res.json({
          success: true,
          plate: plateNumber,
          data: records[0]
        });
      }
 
      return res.json({
        success: false,
        plate: plateNumber,
        message: 'No vehicle found'
      });
    }
 
    return res.status(500).json({
      success: false,
      message: 'API error'
    });
 
  } catch (error) {
    console.error('Error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});
 
// Optional: search by query param too (useful when you OCR from image)
// Example: /api/vehicle?plate=12-345-67
app.get('/api/vehicle', async (req, res) => {
  const rawPlate = req.query.plate;
  const plateNumber = normalizePlate(rawPlate);
 
  console.log('Searching for:', { rawPlate, plateNumber });
 
  if (!plateNumber) {
    return res.status(400).json({
      success: false,
      message: 'Invalid plate number'
    });
  }
 
  try {
    const response = await axios.get('https://data.gov.il/api/3/action/datastore_search', {
      params: {
        resource_id: '053cea08-09bc-40ec-8f7a-156f0677aff3',
        filters: JSON.stringify({
          mispar_rechev: plateNumber
        }),
        limit: 1
      },
      timeout: 10000
    });
 
    if (response.data && response.data.success) {
      const records = response.data.result?.records || [];
 
      if (records.length > 0) {
        return res.json({
          success: true,
          plate: plateNumber,
          data: records[0]
        });
      }
 
      return res.json({
        success: false,
        plate: plateNumber,
        message: 'No vehicle found'
      });
    }
 
    return res.status(500).json({
      success: false,
      message: 'API error'
    });
 
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
 
