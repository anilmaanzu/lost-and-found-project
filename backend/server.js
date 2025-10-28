/* === YEH AAPKA SAHI HYBRID SERVER CODE HAI === */
/* === (Local Database + Cloudinary Images) === */
/* === Logging added to debug form data === */

require('dotenv').config(); // .env file se keys laane ke liye
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg'); // PostgreSQL ke liye
const multer = require('multer'); // Image upload ke liye
const cloudinary = require('cloudinary').v2; // Cloudinary ke liye

const app = express();

// --- MIDDLEWARE ---
app.use(cors());
// IMPORTANT: Multer handles multipart/form-data, so express.json()/urlencoded()
// might not be needed for those routes, but keep them for other potential routes.
app.use(express.json()); 
app.use(express.urlencoded({ extended: true }));


// --- CLOUDINARY CONFIG (Yeh .env file se keys lega) ---
cloudinary.config({ 
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
    api_key: process.env.CLOUDINARY_API_KEY, 
    api_secret: process.env.CLOUDINARY_API_SECRET 
});

// --- MULTER SETUP (Image ko server ki memory mein rakhega) ---
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// --- DATABASE CONNECTION (Smart Version for Local + Render) ---
const dbPool = new Pool({
    connectionString: process.env.DATABASE_URL,
    // Add SSL config only if DATABASE_URL is NOT localhost
    // Render URLs typically include the host, local ones might not explicitly
    ssl: process.env.DATABASE_URL && !process.env.DATABASE_URL.includes("localhost") 
        ? { rejectUnauthorized: false } 
        : false 
});


// --- API ENDPOINTS (ROUTES) ---

app.get('/', (req, res) => {
    res.send('Hybrid server (Local DB + Cloudinary) is running!');
});

// Helper function (Cloudinary par upload karne ke liye)
const handleUpload = (buffer) => {
    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
            { resource_type: "auto" },
            (error, result) => {
                if (error) reject(error);
                else resolve(result);
            }
        );
        uploadStream.end(buffer);
    });
};

// Endpoint: LOST item submit karna
app.post('/api/lost', upload.single('image'), async (req, res) => {
    try {
        // --- ADDED LOGGING ---
        console.log("Received data for /api/lost:", req.body); 
        console.log("Received file for /api/lost:", req.file ? req.file.originalname : "No file");
        // ---------------------

        const { itemName, category, location, date, description, contactName, contactEmail } = req.body;
        let imageUrl = null; // Shuruaat mein image URL null hai

        // Check if essential data is missing
         if (!itemName || !contactName || !contactEmail) {
             console.error("Validation Error: Missing required fields", req.body);
             return res.status(400).json({ success: false, message: "Missing required fields (Item Name, Your Name, Your Email)." });
        }


        // Agar user ne file upload ki hai
        if (req.file) {
             console.log("Attempting Cloudinary upload...");
            // File ko Cloudinary par upload karo
            const uploadResult = await handleUpload(req.file.buffer);
            imageUrl = uploadResult.secure_url; // Cloudinary se mila URL
             console.log("Cloudinary upload successful:", imageUrl);
        }

        // Database mein naya item save karo (imageUrl ke saath)
        console.log("Attempting database insert...");
        const newLostItem = await dbPool.query(
            `INSERT INTO lost_items (item_name, category, lost_location, lost_date, description, contact_name, contact_email, image_url) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
             RETURNING *`,
            [itemName, category, location, date, description, contactName, contactEmail, imageUrl]
        );
        console.log("Database insert successful:", newLostItem.rows[0]);
        res.status(201).json({ success: true, item: newLostItem.rows[0] });

    } catch (err) {
        console.error('Error saving lost item:', err.message);
        // Also log the request body in case of error
        console.error("Request body during error:", req.body);
        res.status(500).json({ success: false, message: 'Server error occurred. Check logs.' });
    }
});

// Endpoint: FOUND item submit karna
app.post('/api/found', upload.single('image'), async (req, res) => {
    try {
        // --- ADDED LOGGING ---
        console.log("Received data for /api/found:", req.body); 
        console.log("Received file for /api/found:", req.file ? req.file.originalname : "No file");
        // ---------------------

        const { itemName, category, location, date, description, contactName, contactEmail } = req.body;
        let imageUrl = null;

         // Check if essential data is missing
         if (!itemName || !contactName || !contactEmail) {
             console.error("Validation Error: Missing required fields", req.body);
             return res.status(400).json({ success: false, message: "Missing required fields (Item Name, Your Name, Your Email)." });
        }

        // Agar user ne file upload ki hai
        if (req.file) {
            console.log("Attempting Cloudinary upload...");
            // File ko Cloudinary par upload karo
            const uploadResult = await handleUpload(req.file.buffer);
            imageUrl = uploadResult.secure_url; // Cloudinary se mila URL
            console.log("Cloudinary upload successful:", imageUrl);
        }

        // Database mein naya item save karo (imageUrl ke saath)
        console.log("Attempting database insert...");
        const newFoundItem = await dbPool.query(
            `INSERT INTO found_items (item_name, category, found_location, found_date, description, contact_name, contact_email, image_url) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
             RETURNING *`,
            [itemName, category, location, date, description, contactName, contactEmail, imageUrl]
        );
         console.log("Database insert successful:", newFoundItem.rows[0]);
        res.status(201).json({ success: true, item: newFoundItem.rows[0] });

    } catch (err) {
        console.error('Error saving found item:', err.message);
         // Also log the request body in case of error
        console.error("Request body during error:", req.body);
        res.status(500).json({ success: false, message: 'Server error occurred. Check logs.' });
    }
});

// Endpoint: Saare FOUND items homepage ke liye laana
app.get('/api/found-items', async (req, res) => {
    try {
        const allFoundItems = await dbPool.query(
            "SELECT * FROM found_items ORDER BY created_at DESC"
        );
        res.status(200).json({ success: true, items: allFoundItems.rows });
    } catch (err) {
        console.error('Error fetching found items:', err.message);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Endpoint: Saare LOST items homepage ke liye laana
app.get('/api/lost-items', async (req, res) => {
    try {
        const allLostItems = await dbPool.query(
            "SELECT * FROM lost_items ORDER BY created_at DESC"
        );
        res.status(200).json({ success: true, items: allLostItems.rows });
    } catch (err) {
        console.error('Error fetching lost items:', err.message);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});


// --- SERVER KO START KARNA ---
// Use Render's PORT environment variable if available
const PORT = process.env.PORT || 3000; 
app.listen(PORT, () => {
    console.log(`Server (Local DB + Cloudinary Images) listening on port ${PORT}`);
});

