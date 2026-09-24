const express = require("express");
const jwt = require("jsonwebtoken");

const pool = require("../config/db");

const router = express.Router();


// ==========================================
// JWT AUTHENTICATION
// ==========================================

function authenticateToken(req, res, next) {

    const authHeader = req.headers.authorization;

    if (!authHeader) {
        return res.status(401).json({
            success: false,
            message: "Authentication required"
        });
    }

    const token = authHeader.split(" ")[1];

    try {

        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET
        );

        req.user = decoded;

        next();

    } catch (error) {

        return res.status(401).json({
            success: false,
            message: "Invalid or expired token"
        });

    }
}


// ==========================================
// GET ALL APPLICATIONS
// ==========================================

router.get("/", authenticateToken, async (req, res) => {

    try {

        const result = await pool.query(`
            SELECT
                a.id,
                a.student_id,
                a.scholarship_id,
                a.status,
                a.applied_date,
                a.notes,
                a.created_at,
                a.updated_at,

                s.name AS student_name,

                sh.name AS scholarship_name,
                sh.provider AS scholarship_provider,
                sh.amount AS scholarship_amount,
                sh.deadline AS scholarship_deadline

            FROM applications a

            JOIN students s
                ON a.student_id = s.id

            JOIN scholarships sh
                ON a.scholarship_id = sh.id

            ORDER BY a.created_at DESC
        `);

        res.json({
            success: true,
            applications: result.rows
        });

    } catch (error) {

        console.error("Get applications error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch applications"
        });

    }

});


// ==========================================
// GET SINGLE APPLICATION
// ==========================================

router.get("/:id", authenticateToken, async (req, res) => {

    if (!/^\d+$/.test(req.params.id)) return res.status(400).json({ success: false, message: "Invalid application ID" });

    try {

        const result = await pool.query(`
            SELECT
                a.*,

                s.name AS student_name,

                sh.name AS scholarship_name,
                sh.provider AS scholarship_provider,
                sh.amount AS scholarship_amount

            FROM applications a

            JOIN students s
                ON a.student_id = s.id

            JOIN scholarships sh
                ON a.scholarship_id = sh.id

            WHERE a.id = $1
        `, [
            req.params.id
        ]);


        if (result.rows.length === 0) {

            return res.status(404).json({
                success: false,
                message: "Application not found"
            });

        }


        res.json({
            success: true,
            application: result.rows[0]
        });


    } catch (error) {

        console.error("Get application error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch application"
        });

    }

});


// ==========================================
// CREATE APPLICATION
// ==========================================

router.post("/", authenticateToken, async (req, res) => {

    try {

        const {
            student_id,
            scholarship_id,
            status,
            notes
        } = req.body;


        // -----------------------------
        // Validation
        // -----------------------------

        if (!student_id || !scholarship_id) {

            return res.status(400).json({
                success: false,
                message: "Student and scholarship are required"
            });

        }

        const allowedStatuses = ["Pending", "Submitted", "Under Review", "Selected", "Rejected"];
        if (status && !allowedStatuses.includes(status)) return res.status(400).json({ success: false, message: "Invalid application status" });


        // -----------------------------
        // Check student exists
        // -----------------------------

        const studentResult = await pool.query(
            `
            SELECT id, name
            FROM students
            WHERE id = $1
            `,
            [student_id]
        );


        if (studentResult.rows.length === 0) {

            return res.status(404).json({
                success: false,
                message: "Student not found"
            });

        }


        // -----------------------------
        // Check scholarship exists
        // -----------------------------

        const scholarshipResult = await pool.query(
            `
            SELECT id, name
            FROM scholarships
            WHERE id = $1
            `,
            [scholarship_id]
        );


        if (scholarshipResult.rows.length === 0) {

            return res.status(404).json({
                success: false,
                message: "Scholarship not found"
            });

        }


        // -----------------------------
        // Check duplicate application
        // -----------------------------

        const duplicateResult = await pool.query(
            `
            SELECT id
            FROM applications
            WHERE student_id = $1
            AND scholarship_id = $2
            `,
            [
                student_id,
                scholarship_id
            ]
        );


        if (duplicateResult.rows.length > 0) {

            return res.status(400).json({
                success: false,
                message: "Student has already applied for this scholarship"
            });

        }


        // -----------------------------
        // Maximum 5 scholarships
        // -----------------------------

        const countResult = await pool.query(
            `
            SELECT COUNT(*) AS count
            FROM applications
            WHERE student_id = $1
            `,
            [student_id]
        );


        const applicationCount =
            parseInt(countResult.rows[0].count);


        if (applicationCount >= 5) {

            return res.status(400).json({
                success: false,
                message: "A student can apply for maximum 5 scholarships"
            });

        }


        // -----------------------------
        // Insert application
        // -----------------------------

        const result = await pool.query(
            `
            INSERT INTO applications
            (
                student_id,
                scholarship_id,
                status,
                notes
            )

            VALUES
            (
                $1,
                $2,
                $3,
                $4
            )

            RETURNING *
            `,
            [
                student_id,
                scholarship_id,
                status || "Pending",
                notes || null
            ]
        );


        res.status(201).json({

            success: true,

            message: "Application created successfully",

            application: result.rows[0]

        });


    } catch (error) {

        console.error("Create application error:", error);

        // PostgreSQL duplicate constraint
        if (error.code === "23505") {

            return res.status(400).json({
                success: false,
                message: "Student has already applied for this scholarship"
            });

        }


        res.status(500).json({
            success: false,
            message: "Failed to create application"
        });

    }

});


// ==========================================
// UPDATE APPLICATION STATUS
// ==========================================

router.patch("/:id/status", authenticateToken, async (req, res) => {

    if (!/^\d+$/.test(req.params.id)) return res.status(400).json({ success: false, message: "Invalid application ID" });

    try {

        const {
            status
        } = req.body;


        const allowedStatuses = [
            "Pending",
            "Submitted",
            "Under Review",
            "Selected",
            "Rejected"
        ];


        if (!status) {

            return res.status(400).json({
                success: false,
                message: "Status is required"
            });

        }


        if (!allowedStatuses.includes(status)) {

            return res.status(400).json({
                success: false,
                message: "Invalid application status"
            });

        }


        const result = await pool.query(
            `
            UPDATE applications

            SET
                status = $1,
                updated_at = CURRENT_TIMESTAMP

            WHERE id = $2

            RETURNING *
            `,
            [
                status,
                req.params.id
            ]
        );


        if (result.rows.length === 0) {

            return res.status(404).json({
                success: false,
                message: "Application not found"
            });

        }


        res.json({

            success: true,

            message: "Application status updated",

            application: result.rows[0]

        });


    } catch (error) {

        console.error("Update application error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to update application"
        });

    }

});


// ==========================================
// UPDATE APPLICATION NOTES
// ==========================================

router.patch("/:id/notes", authenticateToken, async (req, res) => {

    if (!/^\d+$/.test(req.params.id)) return res.status(400).json({ success: false, message: "Invalid application ID" });

    try {

        const {
            notes
        } = req.body;


        const result = await pool.query(
            `
            UPDATE applications

            SET
                notes = $1,
                updated_at = CURRENT_TIMESTAMP

            WHERE id = $2

            RETURNING *
            `,
            [
                notes || null,
                req.params.id
            ]
        );


        if (result.rows.length === 0) {

            return res.status(404).json({
                success: false,
                message: "Application not found"
            });

        }


        res.json({

            success: true,

            message: "Application notes updated",

            application: result.rows[0]

        });


    } catch (error) {

        console.error("Update notes error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to update notes"
        });

    }

});


// ==========================================
// DELETE APPLICATION
// ==========================================

router.delete("/:id", authenticateToken, async (req, res) => {

    if (!/^\d+$/.test(req.params.id)) return res.status(400).json({ success: false, message: "Invalid application ID" });

    try {

        const result = await pool.query(
            `
            DELETE FROM applications

            WHERE id = $1

            RETURNING id
            `,
            [req.params.id]
        );


        if (result.rows.length === 0) {

            return res.status(404).json({
                success: false,
                message: "Application not found"
            });

        }


        res.json({

            success: true,

            message: "Application deleted successfully"

        });


    } catch (error) {

        console.error("Delete application error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to delete application"
        });

    }

});


module.exports = router;
