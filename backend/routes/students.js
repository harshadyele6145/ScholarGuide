const express = require("express");
const jwt = require("jsonwebtoken");

const pool = require("../config/db");

const router = express.Router();


// ========================================
// AUTH MIDDLEWARE
// ========================================

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


// ========================================
// GET ALL STUDENTS
// ========================================

router.get("/", authenticateToken, async (req, res) => {

    try {

        const result = await pool.query(
            `SELECT *
             FROM students
             ORDER BY created_at DESC`
        );

        res.json({
            success: true,
            students: result.rows
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch students"
        });

    }

});


// ========================================
// GET SINGLE STUDENT
// ========================================

router.get("/:id", authenticateToken, async (req, res) => {

    if (!/^\d+$/.test(req.params.id)) return res.status(400).json({ success: false, message: "Invalid student ID" });

    try {

        const result = await pool.query(
            `SELECT *
             FROM students
             WHERE id = $1`,
            [req.params.id]
        );

        if (result.rows.length === 0) {

            return res.status(404).json({
                success: false,
                message: "Student not found"
            });

        }

        res.json({
            success: true,
            student: result.rows[0]
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch student"
        });

    }

});


// ========================================
// ADD STUDENT
// ========================================

router.post("/", authenticateToken, async (req, res) => {

    try {

        const {
            name,
            mobile,
            course,
            academic_year,
            percentage_10th,
            percentage_12th,
            mathematics_percentage,
            family_income,
            category,
            gender,
            age,
            state,
            college,
            admission_type,
            student_status,
            existing_scholarship,
            disability,
            special_family_condition
        } = req.body;


        if (!name) {

            return res.status(400).json({
                success: false,
                message: "Student name is required"
            });

        }

        const numericFields = { percentage_10th, percentage_12th, mathematics_percentage, family_income, age };
        for (const [field, value] of Object.entries(numericFields)) {
            if (value !== undefined && value !== null && value !== "" && (!Number.isFinite(Number(value)) || Number(value) < 0)) {
                return res.status(400).json({ success: false, message: `${field} must be a non-negative number` });
            }
        }
        for (const field of ["percentage_10th", "percentage_12th", "mathematics_percentage"]) {
            if (numericFields[field] !== undefined && numericFields[field] !== null && numericFields[field] !== "" && Number(numericFields[field]) > 100) {
                return res.status(400).json({ success: false, message: `${field} must not exceed 100` });
            }
        }


        const result = await pool.query(
            `INSERT INTO students (
                name,
                mobile,
                course,
                academic_year,
                percentage_10th,
                percentage_12th,
                mathematics_percentage,
                family_income,
                category,
                gender,
                age,
                state,
                college,
                admission_type,
                student_status,
                existing_scholarship,
                disability,
                special_family_condition
            )
            VALUES (
                $1,$2,$3,$4,$5,$6,$7,$8,$9,
                $10,$11,$12,$13,$14,$15,$16,$17,$18
            )
            RETURNING *`,
            [
                name,
                mobile || null,
                course || null,
                academic_year || null,
                percentage_10th ?? null,
                percentage_12th ?? null,
                mathematics_percentage ?? null,
                family_income ?? null,
                category || null,
                gender || null,
                age ?? null,
                state || null,
                college || null,
                admission_type || null,
                student_status || null,
                existing_scholarship || null,
                disability || null,
                special_family_condition || null
            ]
        );


        res.status(201).json({
            success: true,
            message: "Student added successfully",
            student: result.rows[0]
        });


    } catch (error) {

        console.error(error);

        res.status(500).json({
            success: false,
            message: "Failed to add student"
        });

    }

});


// ========================================
// DELETE STUDENT
// ========================================

router.delete("/:id", authenticateToken, async (req, res) => {

    if (!/^\d+$/.test(req.params.id)) return res.status(400).json({ success: false, message: "Invalid student ID" });

    try {

        const result = await pool.query(
            `DELETE FROM students
             WHERE id = $1
             RETURNING id`,
            [req.params.id]
        );


        if (result.rows.length === 0) {

            return res.status(404).json({
                success: false,
                message: "Student not found"
            });

        }


        res.json({
            success: true,
            message: "Student deleted successfully"
        });


    } catch (error) {

        console.error(error);

        res.status(500).json({
            success: false,
            message: "Failed to delete student"
        });

    }

});


module.exports = router;
