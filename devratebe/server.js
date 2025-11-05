// server.js

// compiler-backend/server.js

// 1. Load Environment Variables (Ensure this is near the top)
require('dotenv').config(); 

// 2. Load Express
const express = require('express');


// 2. Setup constants from environment variables
const PORT = process.env.PORT || 5173;
const CLIENT_ID = process.env.JDOODLE_CLIENT_ID;
const CLIENT_SECRET = process.env.JDOODLE_CLIENT_SECRET;
const JD_API_URL = 'https://api.jdoodle.com/v1/execute';

// 3. Initialize Express app
const app = express();

// Middleware to parse incoming JSON requests from the frontend
app.use(express.json());

// 4. THE PROXY ROUTE: /api/execute
app.post('/api/execute', async (req, res) => {
    // 4a. Get code and language from your frontend
    const { script, language } = req.body;

    if (!script || !language) {
        return res.status(400).json({ error: 'Missing code or language in request.' });
    }

    // 4b. Construct the data payload for the JDoodle API
    const executionPayload = {
        clientId: CLIENT_ID,           // SECURELY added on the backend
        clientSecret: CLIENT_SECRET,   // SECURELY added on the backend
        script: script,
        language: language,
        versionIndex: "0",             // Use default version for simplicity
        stdin: "",                     // Add this if you want to support user input
    };

    console.log(`Executing ${language} script...`);

    console.log(`Executing ${language} script...`);

    try {
        // 4c. Send the request to the external JDoodle API
        const jdoodleResponse = await fetch(JD_API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(executionPayload),
        });
        
        // 🌟 START OF NEW CHECKING CODE 🌟
        
        // 1. Log the HTTP status code from JDoodle to the console.
        console.log(`[JDoodle Check] API Response Status: ${jdoodleResponse.status}`); 

        // 2. Check if the response was NOT successful (status 400, 401, 500, etc.)
        if (!jdoodleResponse.ok) {
            const errorText = await jdoodleResponse.text();
            console.error('[JDoodle Check] Full Error Body:', errorText);
            
            // Send a clear error back to the frontend
            return res.status(502).json({ 
                error: 'Compiler Service Authentication or API Error.',
                detail: `JDoodle returned status ${jdoodleResponse.status}`,
                jdoodleError: errorText // Include the raw error for debugging
            });
        }
        const result = await jdoodleResponse.json();
        console.log('[JDoodle Check] Parsed JSON Result:', result); // <--- ADD THIS LINE

        // 4d. Send the entire result object back to your frontend
        res.json(result);

    } catch (error) {
        console.error('Error calling JDoodle API:', error);
        res.status(500).json({ error: 'Internal server error while executing code.' });
    }
});

// 5. Start the server
app.listen(PORT, () => {
    console.log(`\n\n✅ Compiler Proxy Server running on http://localhost:${PORT}`);
    console.log('Backend is ready to receive requests from your frontend.');
});