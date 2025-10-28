/* === YEH AAPKA SAHI HYBRID SERVER CODE HAI === */
/* === (Local Database + Cloudinary Images) === */

require('dotenv').config(); // .env file se keys laane ke liye
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg'); // PostgreSQL ke liye
const multer = require('multer'); // Image upload ke liye
const cloudinary = require('cloudinary').v2; // Cloudinary ke liye

const app = express();

// --- MIDDLEWARE ---
app.use(cors());
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

// --- DATABASE CONNECTION (Local DB - No SSL!) ---
// Yeh .env file se aapka local DATABASE_URL lega
// Ismein SSL block nahi hai, isliye error fix ho jaayega
const dbPool = new Pool({
    connectionString: process.env.DATABASE_URL
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
        const { itemName, category, location, date, description, contactName, contactEmail } = req.body;
        let imageUrl = null; // Shuruaat mein image URL null hai

        // Agar user ne file upload ki hai
        if (req.file) {
            // File ko Cloudinary par upload karo
            const uploadResult = await handleUpload(req.file.buffer);
            imageUrl = uploadResult.secure_url; // Cloudinary se mila URL
        }

        // Database mein naya item save karo (imageUrl ke saath)
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

// Endpoint: FOUND item submit karna
app.post('/api/found', upload.single('image'), async (req, res) => {
    try {
        const { itemName, category, location, date, description, contactName, contactEmail } = req.body;
        let imageUrl = null;

        // Agar user ne file upload ki hai
        if (req.file) {
            // File ko Cloudinary par upload karo
            const uploadResult = await handleUpload(req.file.buffer);
            imageUrl = uploadResult.secure_url; // Cloudinary se mila URL
        }

        // Database mein naya item save karo (imageUrl ke saath)
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
app.listen(3000, () => {
    console.log('Server (Local DB + Cloudinary Images) listening on port 3000');
});