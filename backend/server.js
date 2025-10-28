require('dotenv').config(); // This will load your local .env file
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;

const app = express();
const port = 3000;

// --- MIDDLEWARE ---
app.use(cors()); 
app.use(express.json()); 
app.use(express.urlencoded({ extended: true }));

// --- CLOUDINARY CONFIG ---
cloudinary.config({ 
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
    api_key: process.env.CLOUDINARY_API_KEY, 
    api_secret: process.env.CLOUDINARY_API_SECRET 
});

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// --- DATABASE CONNECTION (PRODUCTION READY) ---
// This code now works for BOTH local and live (Render)
const dbPool = new Pool({
    connectionString: process.env.DATABASE_URL, // This is the key
    ssl: {
        rejectUnauthorized: false // Required for Render
    }
});

// --- API ENDPOINTS (ROUTES) ---

// (All your app.get, app.post endpoints...)
// ... (app.get('/'), app.post('/api/lost'), app.post('/api/found')) ...
// ... (app.get('/api/found-items'), app.get('/api/lost-items')) ...

// PASTE ALL YOUR ENDPOINTS HERE
app.get('/', (req, res) => {
    res.send('Backend server is running!');
});

// Helper function to handle image upload
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

// Endpoint for submitting a LOST item
app.post('/api/lost', upload.single('image'), async (req, res) => {
    try {
        const { itemName, category, location, date, description, contactName, contactEmail } = req.body;
        let imageUrl = null;

        if (req.file) {
            const uploadResult = await handleUpload(req.file.buffer);
            imageUrl = uploadResult.secure_url;
        }

        const newLostItem = await dbPool.query(
            `INSERT INTO lost_items (item_name, category, lost_location, lost_date, description, contact_name, contact_email, image_url) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
             RETURNING *`,
            [itemName, category, location, date, description, contactName, contactEmail, imageUrl]
        );
        res.status(201).json({ success: true, item: newLostItem.rows[0] });

    } catch (err) {
        console.error('Error saving lost item:', err.message);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Endpoint for submitting a FOUND item
app.post('/api/found', upload.single('image'), async (req, res) => {
    try {
        const { itemName, category, location, date, description, contactName, contactEmail } = req.body;
        let imageUrl = null;

        if (req.file) {
            const uploadResult = await handleUpload(req.file.buffer);
            imageUrl = uploadResult.secure_url;
        }

        const newFoundItem = await dbPool.query(
            `INSERT INTO found_items (item_name, category, found_location, found_date, description, contact_name, contact_email, image_url) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
             RETURNING *`,
            [itemName, category, location, date, description, contactName, contactEmail, imageUrl]
        );
        res.status(201).json({ success: true, item: newFoundItem.rows[0] });

    } catch (err) {
        console.error('Error saving found item:', err.message);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// GET ALL FOUND ITEMS
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

// GET ALL LOST ITEMS
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


// --- START THE SERVER ---
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});