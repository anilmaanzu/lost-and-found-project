// ENDPOINT FOR NEW USER REGISTRATION
app.post('/api/register', async (req, res) => {
    try {
        const { name, email, password } = req.body;

        // 1. Check if user already exists
        const userCheck = await dbPool.query("SELECT * FROM users WHERE email = $1", [email]);
        if (userCheck.rows.length > 0) {
            return res.status(400).json({ success: false, message: "Email already exists" });
        }

        // 2. Hash the password
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        // 3. Save new user to database
        const newUser = await dbPool.query(
            "INSERT INTO users (name, email, password_hash) VALUES ($1, $2, $3) RETURNING id, name, email",
            [name, email, passwordHash]
        );

        res.status(201).json({ success: true, user: newUser.rows[0] });

    } catch (err) {
        console.error('Error during registration:', err.message);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});