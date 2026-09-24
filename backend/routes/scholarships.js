const express = require("express");
const jwt = require("jsonwebtoken");

const pool = require("../config/db");

const router = express.Router();


// ================================
// AUTH MIDDLEWARE
// ================================

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

        req.user = jwt.verify(
            token,
            process.env.JWT_SECRET
        );

        next();

    } catch (error) {

        return res.status(401).json({
            success: false,
            message: "Invalid or expired token"
        });

    }
}


// ================================
// GET ALL SCHOLARSHIPS
// ================================

router.get("/", authenticateToken, async (req, res) => {

    try {

        const result = await pool.query(`
            SELECT *
            FROM scholarships
            ORDER BY created_at DESC
        `);

        res.json({
            success: true,
            scholarships: result.rows
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch scholarships"
        });

    }

});


// ================================
// GET SINGLE SCHOLARSHIP
// ================================

router.get("/:id", authenticateToken, async (req, res) => {

    if (!/^\d+$/.test(req.params.id)) return res.status(400).json({ success: false, message: "Invalid scholarship ID" });

    try {

        const result = await pool.query(
            `SELECT *
             FROM scholarships
             WHERE id = $1`,
            [req.params.id]
        );

        if (result.rows.length === 0) {

            return res.status(404).json({
                success: false,
                message: "Scholarship not found"
            });

        }

        res.json({
            success: true,
            scholarship: result.rows[0]
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch scholarship"
        });

    }

});


// ================================
// ADD SCHOLARSHIP
// ================================

router.post("/", authenticateToken, async (req, res) => {

    try {

        const {
            name,
            provider,
            amount,
            deadline,
            application_url,
            status,
            last_verified,

            min_10th,
            min_12th,
            max_income,
            min_age,
            max_age,
            min_math,

            eligible_courses,
            eligible_years,
            eligible_categories,
            eligible_gender,
            eligible_states,
            eligible_colleges,
            eligible_admission_type,
            eligible_student_status,

            disability_requirement,
            family_requirement,
            existing_scholarship_requirement,

            required_documents,
            selection_process,
            renewal_conditions,
            notes
        } = req.body;


        if (!name) {

            return res.status(400).json({
                success: false,
                message: "Scholarship name is required"
            });

        }

        const scores = { min_10th, min_12th, min_math };
        for (const [field, value] of Object.entries(scores)) {
            if (value !== undefined && value !== null && value !== "" && (!Number.isFinite(Number(value)) || Number(value) < 0 || Number(value) > 100)) {
                return res.status(400).json({ success: false, message: `${field} must be between 0 and 100` });
            }
        }
        for (const [field, value] of Object.entries({ amount, max_income, min_age, max_age })) {
            if (value !== undefined && value !== null && value !== "" && (!Number.isFinite(Number(value)) || Number(value) < 0)) {
                return res.status(400).json({ success: false, message: `${field} must be a non-negative number` });
            }
        }


        const result = await pool.query(
            `INSERT INTO scholarships (

                name,
                provider,
                amount,
                deadline,
                application_url,
                status,
                last_verified,

                min_10th,
                min_12th,
                max_income,
                min_age,
                max_age,
                min_math,

                eligible_courses,
                eligible_years,
                eligible_categories,
                eligible_gender,
                eligible_states,
                eligible_colleges,

                eligible_admission_type,
                eligible_student_status,

                disability_requirement,
                family_requirement,
                existing_scholarship_requirement,

                required_documents,
                selection_process,
                renewal_conditions,
                notes

            )
            VALUES (
                $1,$2,$3,$4,$5,$6,$7,
                $8,$9,$10,$11,$12,$13,
                $14,$15,$16,$17,$18,$19,
                $20,$21,
                $22,$23,$24,
                $25,$26,$27,$28
            )
            RETURNING *`,
            [

                name,
                provider || null,
                amount || null,
                deadline || null,
                application_url || null,
                status || "Open",
                last_verified || null,

                min_10th ?? null,
                min_12th ?? null,
                max_income ?? null,
                min_age ?? null,
                max_age ?? null,
                min_math ?? null,

                eligible_courses || [],
                eligible_years || [],
                eligible_categories || [],
                eligible_gender || [],
                eligible_states || [],
                eligible_colleges || [],

                eligible_admission_type || [],
                eligible_student_status || [],

                disability_requirement || null,
                family_requirement || null,
                existing_scholarship_requirement || null,

                required_documents || null,
                selection_process || null,
                renewal_conditions || null,
                notes || null
            ]
        );


        res.status(201).json({
            success: true,
            message: "Scholarship added successfully",
            scholarship: result.rows[0]
        });


    } catch (error) {

        console.error(error);

        res.status(500).json({
            success: false,
            message: "Failed to add scholarship"
        });

    }

});


// ================================
// DELETE SCHOLARSHIP
// ================================

router.delete("/:id", authenticateToken, async (req, res) => {

    if (!/^\d+$/.test(req.params.id)) return res.status(400).json({ success: false, message: "Invalid scholarship ID" });

    try {

        const result = await pool.query(
            `DELETE FROM scholarships
             WHERE id = $1
             RETURNING id`,
            [req.params.id]
        );


        if (result.rows.length === 0) {

            return res.status(404).json({
                success: false,
                message: "Scholarship not found"
            });

        }


        res.json({
            success: true,
            message: "Scholarship deleted successfully"
        });


    } catch (error) {

        console.error(error);

        res.status(500).json({
            success: false,
            message: "Failed to delete scholarship"
        });

    }

});


module.exports = router;
