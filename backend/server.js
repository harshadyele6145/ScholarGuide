const express = require("express");
const cors = require("cors");
const path = require("path");
require("dotenv").config();

const pool = require("./config/db");

const authRoutes = require("./routes/auth");
const studentRoutes = require("./routes/students");
const scholarshipRoutes = require("./routes/scholarships");
const applicationRoutes = require("./routes/applications");

const app = express();


// ===============================
// MIDDLEWARE
// ===============================

const allowedOrigins = (process.env.FRONTEND_ORIGINS || "").split(",").map(value => value.trim()).filter(Boolean);
app.use(cors({ origin: allowedOrigins.length ? allowedOrigins : true }));

app.use(express.json());
app.use(express.static(path.join(__dirname, "..", "frontend")));


// ===============================
// ROUTES
// ===============================

app.use("/api/auth", authRoutes);

app.use("/api/students", studentRoutes);

app.use("/api/scholarships", scholarshipRoutes);
app.use("/api/applications", applicationRoutes);


// ===============================
// HOME
// ===============================

app.get("/", (req, res) => res.sendFile(path.join(__dirname, "..", "frontend", "login.html")));


// ===============================
// DATABASE TEST
// ===============================

app.get("/api/test-db", async (req, res) => {

    try {

        const result =
            await pool.query("SELECT NOW()");

        res.json({

            success: true,

            message:
                "PostgreSQL connected successfully ✅",

            time:
                result.rows[0].now

        });

    } catch (error) {

        console.error(
            "Database error:",
            error
        );

        res.status(500).json({

            success: false,

            message:
                "Database connection failed ❌"

        });

    }

});


// ===============================
// 404
// ===============================

app.use((req, res) => {

    res.status(404).json({

        success: false,

        message: "Route not found"

    });

});

app.get("/api/health", (req, res) => res.json({ success: true, message: "ScholarGuide API is running" }));

// ===============================
// ERROR HANDLER
// ===============================

app.use(
    (error, req, res, next) => {

        if (error instanceof SyntaxError && error.status === 400 && "body" in error) {
            return res.status(400).json({ success: false, message: "Invalid JSON body" });
        }

        console.error("Server error:", error.message);

        res.status(500).json({

            success: false,

            message:
                "Internal server error"

        });

    }
);


// ===============================
// START SERVER
// ===============================

const PORT = process.env.PORT || 5000;


app.listen(
    PORT,
    () => {

        console.log(
            `🚀 ScholarGuide server running on http://localhost:${PORT}`
        );

    }
);
