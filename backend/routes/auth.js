const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const pool = require("../config/db");

const router = express.Router();

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;


// ========================================
// REGISTER USER
// ========================================

router.post("/register", async (req, res) => {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({
                success: false,
                message: "Name, email and password are required"
            });
        }

        if (!emailPattern.test(email) || password.length < 8) {
            return res.status(400).json({ success: false, message: "Enter a valid email and a password of at least 8 characters" });
        }

        if (process.env.ALLOW_ADMIN_REGISTRATION !== "true") {
            return res.status(403).json({ success: false, message: "Admin registration is disabled. Set ALLOW_ADMIN_REGISTRATION=true temporarily to create the first admin." });
        }

        const adminCount = await pool.query("SELECT COUNT(*)::int AS count FROM users");
        if (adminCount.rows[0].count > 0) {
            return res.status(403).json({ success: false, message: "An admin account already exists. Registration is closed." });
        }

        const existingUser = await pool.query(
            "SELECT id FROM users WHERE email = $1",
            [email]
        );

        if (existingUser.rows.length > 0) {
            return res.status(400).json({
                success: false,
                message: "User already exists"
            });
        }

        const passwordHash = await bcrypt.hash(password, 10);

        const result = await pool.query(
            `INSERT INTO users
            (name, email, password_hash)
            VALUES ($1, $2, $3)
            RETURNING id, name, email`,
            [name, email, passwordHash]
        );

        res.status(201).json({
            success: true,
            message: "User registered successfully",
            user: result.rows[0]
        });

    } catch (error) {

        console.error("Register error:", error);

        res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
});


// ========================================
// LOGIN
// ========================================

router.post("/login", async (req, res) => {
    try {

        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Email and password are required"
            });
        }

        if (!process.env.JWT_SECRET) {
            return res.status(500).json({ success: false, message: "Server authentication is not configured" });
        }

        const result = await pool.query(
            "SELECT * FROM users WHERE email = $1",
            [email]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password"
            });
        }

        const user = result.rows[0];

        const passwordMatch = await bcrypt.compare(
            password,
            user.password_hash
        );

        if (!passwordMatch) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password"
            });
        }

        const token = jwt.sign(
            {
                id: user.id,
                email: user.email
            },
            process.env.JWT_SECRET,
            {
                expiresIn: "2h"
            }
        );

        res.json({
            success: true,
            message: "Login successful",

            token,

            user: {
                id: user.id,
                name: user.name,
                email: user.email
            }
        });

    } catch (error) {

        console.error("Login error:", error);

        res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
});


// ========================================
// VERIFY TOKEN
// ========================================

router.get("/me", async (req, res) => {

    try {

        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({
                success: false,
                message: "No token provided"
            });
        }

        const token = authHeader.split(" ")[1];

        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET
        );

        const result = await pool.query(
            "SELECT id, name, email FROM users WHERE id = $1",
            [decoded.id]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({
                success: false,
                message: "User not found"
            });
        }

        res.json({
            success: true,
            user: result.rows[0]
        });

    } catch (error) {

        return res.status(401).json({
            success: false,
            message: "Invalid or expired token"
        });
    }

});


module.exports = router;
