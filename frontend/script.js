// ============================================================
// SCHOLARGUIDE - COMPLETE FRONTEND SCRIPT
// ============================================================

// Set window.SCHOLARGUIDE_API_URL in api-config.js for a deployed backend.
const API_BASE = `${(window.SCHOLARGUIDE_API_URL || (window.location.protocol === "file:" ? "http://localhost:5000" : window.location.origin)).replace(/\/$/, "")}/api`;

let students = [];
let scholarships = [];
let applications = [];


// ============================================================
// AUTHENTICATION
// ============================================================

function checkLogin() {

    const token = sessionStorage.getItem("token");

    if (!token) {
        window.location.href = "login.html";
        return false;
    }

    return true;
}


if (!checkLogin()) {
    throw new Error("Authentication required");
}


// ============================================================
// API HELPER
// ============================================================

async function apiRequest(endpoint, options = {}) {

    const token = sessionStorage.getItem("token");

    if (!token) {
        window.location.href = "login.html";
        return null;
    }

    try {

        const response = await fetch(
            `${API_BASE}${endpoint}`,
            {
                ...options,

                headers: {
                    "Content-Type": "application/json",

                    "Authorization":
                        `Bearer ${token}`,

                    ...(options.headers || {})
                }
            }
        );


        if (response.status === 401) {

            sessionStorage.removeItem("token");
            sessionStorage.removeItem("user");

            window.location.href = "login.html";

            return null;
        }


        const data = await response.json();

        return data;


    } catch (error) {

        console.error("API Error:", error);

        alert(
            "Cannot connect to backend.\n\n" +
            "Open http://localhost:5000 and make sure the backend is running."
        );

        return null;
    }
}


// ============================================================
// HTML ESCAPE
// ============================================================

function escapeHtml(value) {

    if (
        value === null ||
        value === undefined
    ) {
        return "";
    }

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


// ============================================================
// FORMAT HELPERS
// ============================================================

function formatAmount(value) {

    if (
        value === null ||
        value === undefined ||
        value === ""
    ) {
        return "0";
    }

    return Number(value).toLocaleString("en-IN");
}


function formatDate(value) {

    if (!value) {
        return "-";
    }

    try {

        return new Date(value).toLocaleDateString(
            "en-IN"
        );

    } catch {

        return "-";
    }
}


function parseList(value) {

    if (!value) {
        return [];
    }

    return value
        .split(",")
        .map(item => item.trim())
        .filter(item => item.length > 0);
}


// ============================================================
// LOGOUT
// ============================================================

function logout() {

    sessionStorage.removeItem("token");
    sessionStorage.removeItem("user");

    window.location.href = "login.html";
}


// ============================================================
// USER INFO
// ============================================================

function loadUserInfo() {

    const userData =
        sessionStorage.getItem("user");

    if (!userData) {
        return;
    }

    try {

        const user =
            JSON.parse(userData);

        const elements =
            document.querySelectorAll(
                ".user-name"
            );

        elements.forEach(element => {

            element.textContent =
                user.name || "Admin";

        });

    } catch (error) {

        console.error(
            "User information error:",
            error
        );
    }
}


// ============================================================
// NAVIGATION
// ============================================================

function showSection(sectionId) {

    const sections =
        document.querySelectorAll(
            ".content-section"
        );


    sections.forEach(section => {

        section.style.display = "none";

    });


    const selected =
        document.getElementById(
            sectionId
        );


    if (selected) {

        selected.style.display = "block";

    }


    const navLinks =
        document.querySelectorAll(
            ".nav-link"
        );


    navLinks.forEach(link => {

        link.classList.remove("active");

    });


    const activeLink =
        document.querySelector(
            `.nav-link[data-section="${sectionId}"]`
        );


    if (activeLink) {

        activeLink.classList.add("active");

    }


    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}


// ============================================================
// NAVIGATION LISTENERS
// ============================================================

function setupNavigation() {

    const navLinks =
        document.querySelectorAll(
            ".nav-link"
        );


    navLinks.forEach(link => {

        link.addEventListener(
            "click",
            function(event) {

                event.preventDefault();

                const section =
                    this.dataset.section;

                if (section) {

                    showSection(section);

                }

            }
        );

    });
}


// ============================================================
// ======================= STUDENTS ===========================
// ============================================================


// LOAD STUDENTS

async function loadStudents() {

    const result =
        await apiRequest(
            "/students"
        );


    if (!result) {
        return;
    }


    if (!result.success) {

        console.error(
            result.message
        );

        students = [];

        renderStudents();

        return;
    }


    students =
        result.students || [];


    renderStudents();

    updateDashboard();
}


// RENDER STUDENTS

function renderStudents() {

    const container =
        document.getElementById(
            "studentsList"
        );


    if (!container) {
        return;
    }


    if (students.length === 0) {

        container.innerHTML = `

            <div class="empty-state">

                <h3>
                    No Students Added
                </h3>

                <p>
                    Add your first student.
                </p>

            </div>

        `;

        return;
    }


    container.innerHTML =
        students.map(student => {

            return `

                <div class="student-card">

                    <div class="student-header">

                        <div>

                            <h3>
                                ${escapeHtml(
                                    student.name
                                )}
                            </h3>

                            <p>
                                ${escapeHtml(
                                    student.course || "-"
                                )}
                            </p>

                        </div>

                        <span class="badge">
                            ${escapeHtml(
                                student.student_status || "Active"
                            )}
                        </span>

                    </div>


                    <div class="student-info">

                        <div>

                            <strong>
                                Mobile
                            </strong>

                            <span>
                                ${escapeHtml(
                                    student.mobile || "-"
                                )}
                            </span>

                        </div>


                        <div>

                            <strong>
                                Academic Year
                            </strong>

                            <span>
                                ${escapeHtml(
                                    student.academic_year || "-"
                                )}
                            </span>

                        </div>


                        <div>

                            <strong>
                                10th
                            </strong>

                            <span>
                                ${
                                    student.percentage_10th !== null
                                    ? student.percentage_10th + "%"
                                    : "-"
                                }
                            </span>

                        </div>


                        <div>

                            <strong>
                                12th
                            </strong>

                            <span>
                                ${
                                    student.percentage_12th !== null
                                    ? student.percentage_12th + "%"
                                    : "-"
                                }
                            </span>

                        </div>


                        <div>

                            <strong>
                                Income
                            </strong>

                            <span>
                                ₹${formatAmount(
                                    student.family_income
                                )}
                            </span>

                        </div>


                        <div>

                            <strong>
                                Category
                            </strong>

                            <span>
                                ${escapeHtml(
                                    student.category || "-"
                                )}
                            </span>

                        </div>

                    </div>


                    <div class="student-actions">

                        <button
                            class="btn btn-primary"
                            onclick="
                                checkStudentEligibility(
                                    ${student.id}
                                )
                            "
                        >
                            Check Scholarships
                        </button>


                        <button
                            class="btn btn-danger"
                            onclick="
                                deleteStudent(
                                    ${student.id}
                                )
                            "
                        >
                            Delete
                        </button>

                    </div>

                </div>

            `;

        }).join("");
}


// ADD STUDENT

async function addStudent(event) {

    event.preventDefault();


    const studentData = {

        name:
            document.getElementById(
                "studentName"
            ).value.trim(),

        mobile:
            document.getElementById(
                "studentMobile"
            ).value.trim(),

        course:
            document.getElementById(
                "studentCourse"
            ).value.trim(),

        academic_year:
            document.getElementById(
                "studentYear"
            ).value.trim(),

        percentage_10th:
            document.getElementById(
                "student10th"
            ).value || null,

        percentage_12th:
            document.getElementById(
                "student12th"
            ).value || null,

        mathematics_percentage:
            document.getElementById(
                "studentMath"
            ).value || null,

        family_income:
            document.getElementById(
                "studentIncome"
            ).value || null,

        category:
            document.getElementById(
                "studentCategory"
            ).value || null,

        gender:
            document.getElementById(
                "studentGender"
            ).value || null,

        age:
            document.getElementById(
                "studentAge"
            ).value || null,

        state:
            document.getElementById(
                "studentState"
            ).value || null,

        college:
            document.getElementById(
                "studentCollege"
            ).value || null,

        admission_type:
            document.getElementById(
                "studentAdmissionType"
            ).value || null,

        student_status:
            document.getElementById(
                "studentStatus"
            ).value || null,

        existing_scholarship:
            document.getElementById(
                "studentExistingScholarship"
            ).value || null,

        disability:
            document.getElementById(
                "studentDisability"
            ).value || null,

        special_family_condition:
            document.getElementById(
                "studentSpecialFamily"
            ).value || null
    };


    if (!studentData.name) {

        alert(
            "Student name is required."
        );

        return;
    }


    const result =
        await apiRequest(
            "/students",
            {
                method: "POST",

                body:
                    JSON.stringify(
                        studentData
                    )
            }
        );


    if (!result) {
        return;
    }


    if (!result.success) {

        alert(
            result.message ||
            "Failed to add student."
        );

        return;
    }


    alert(
        "Student added successfully ✅"
    );


    document
        .getElementById("studentForm")
        .reset();


    await loadStudents();

    updateDashboard();
}


// DELETE STUDENT

async function deleteStudent(
    studentId
) {

    const confirmed =
        confirm(
            "Are you sure you want to delete this student?"
        );


    if (!confirmed) {
        return;
    }


    const result =
        await apiRequest(
            `/students/${studentId}`,
            {
                method: "DELETE"
            }
        );


    if (!result) {
        return;
    }


    if (!result.success) {

        alert(
            result.message ||
            "Failed to delete student."
        );

        return;
    }


    await loadStudents();

    await loadApplications();

    updateDashboard();

    alert(
        "Student deleted successfully."
    );
}


// ============================================================
// ===================== SCHOLARSHIPS =========================
// ============================================================


// LOAD SCHOLARSHIPS

async function loadScholarships() {

    const result =
        await apiRequest(
            "/scholarships"
        );


    if (!result) {
        return;
    }


    if (!result.success) {

        console.error(
            result.message
        );

        scholarships = [];

        renderScholarships();

        return;
    }


    scholarships =
        result.scholarships || [];


    renderScholarships();

    updateDashboard();
}


// RENDER SCHOLARSHIPS

function renderScholarships() {

    const container =
        document.getElementById(
            "scholarshipsList"
        );


    if (!container) {
        return;
    }


    if (scholarships.length === 0) {

        container.innerHTML = `

            <div class="empty-state">

                <h3>
                    No Scholarships Added
                </h3>

                <p>
                    Add a scholarship to begin.
                </p>

            </div>

        `;

        return;
    }


    container.innerHTML =
        scholarships.map(scholarship => {

            return `

                <div
                    class="scholarship-card"
                    onclick="
                        openScholarshipDetails(
                            ${scholarship.id}
                        )
                    "
                >

                    <div class="scholarship-header">

                        <div>

                            <h3>
                                ${escapeHtml(
                                    scholarship.name
                                )}
                            </h3>

                            <p>
                                ${escapeHtml(
                                    scholarship.provider || "-"
                                )}
                            </p>

                        </div>


                        <span class="badge">

                            ${escapeHtml(
                                scholarship.status || "Open"
                            )}

                        </span>

                    </div>


                    <div class="scholarship-info">

                        <div>

                            <strong>
                                Amount
                            </strong>

                            <span>
                                ₹${formatAmount(
                                    scholarship.amount
                                )}
                            </span>

                        </div>


                        <div>

                            <strong>
                                Deadline
                            </strong>

                            <span>
                                ${formatDate(
                                    scholarship.deadline
                                )}
                            </span>

                        </div>


                        <div>

                            <strong>
                                Minimum 10th
                            </strong>

                            <span>
                                ${
                                    scholarship.min_10th !== null
                                    ? scholarship.min_10th + "%"
                                    : "-"
                                }
                            </span>

                        </div>


                        <div>

                            <strong>
                                Minimum 12th
                            </strong>

                            <span>
                                ${
                                    scholarship.min_12th !== null
                                    ? scholarship.min_12th + "%"
                                    : "-"
                                }
                            </span>

                        </div>

                    </div>


                    <div class="scholarship-actions">

                        <button
                            type="button"
                            class="btn btn-primary"
                            onclick="
                                event.stopPropagation();
                                openScholarshipDetails(
                                    ${scholarship.id}
                                );
                            "
                        >
                            View Details
                        </button>


                        <button
                            type="button"
                            class="btn btn-danger"
                            onclick="
                                event.stopPropagation();
                                deleteScholarship(
                                    ${scholarship.id}
                                );
                            "
                        >
                            Delete
                        </button>

                    </div>

                </div>

            `;

        }).join("");
}


// ADD SCHOLARSHIP

async function addScholarship(event) {

    event.preventDefault();


    const scholarshipData = {

        name:
            document.getElementById(
                "scholarshipName"
            ).value.trim(),

        provider:
            document.getElementById(
                "scholarshipProvider"
            ).value.trim(),

        amount:
            document.getElementById(
                "scholarshipAmount"
            ).value || null,

        deadline:
            document.getElementById(
                "deadline"
            ).value || null,

        application_url:
            document.getElementById(
                "applicationUrl"
            ).value.trim(),

        status:
            document.getElementById(
                "scholarshipStatus"
            ).value || "Open",

        last_verified:
            document.getElementById(
                "lastVerified"
            ).value || null,

        min_10th:
            document.getElementById(
                "min10th"
            ).value || null,

        min_12th:
            document.getElementById(
                "min12th"
            ).value || null,

        max_income:
            document.getElementById(
                "maxIncome"
            ).value || null,

        min_age:
            document.getElementById(
                "minAge"
            ).value || null,

        max_age:
            document.getElementById(
                "maxAge"
            ).value || null,

        min_math:
            document.getElementById(
                "minMath"
            ).value || null,


        // JSONB fields
        eligible_courses:
            parseList(
                document.getElementById(
                    "eligibleCourses"
                ).value
            ),

        eligible_years:
            parseList(
                document.getElementById(
                    "eligibleYears"
                ).value
            ),

        eligible_categories:
            parseList(
                document.getElementById(
                    "eligibleCategories"
                ).value
            ),

        eligible_gender:
            parseList(
                document.getElementById(
                    "eligibleGender"
                ).value
            ),

        eligible_states:
            parseList(
                document.getElementById(
                    "eligibleStates"
                ).value
            ),

        eligible_colleges:
            parseList(
                document.getElementById(
                    "eligibleColleges"
                ).value
            ),

        eligible_admission_type:
            parseList(
                document.getElementById(
                    "eligibleAdmissionType"
                ).value
            ),

        eligible_student_status:
            parseList(
                document.getElementById(
                    "eligibleStudentStatus"
                ).value
            ),


        disability_requirement:
            document.getElementById(
                "disabilityRequirement"
            ).value.trim(),

        family_requirement:
            document.getElementById(
                "familyRequirement"
            ).value.trim(),

        existing_scholarship_requirement:
            document.getElementById(
                "existingScholarshipRequirement"
            ).value.trim(),

        required_documents:
            document.getElementById(
                "requiredDocuments"
            ).value.trim(),

        selection_process:
            document.getElementById(
                "selectionProcess"
            ).value.trim(),

        renewal_conditions:
            document.getElementById(
                "renewalConditions"
            ).value.trim(),

        notes:
            document.getElementById(
                "scholarshipNotes"
            ).value.trim()
    };


    if (!scholarshipData.name) {

        alert(
            "Scholarship name is required."
        );

        return;
    }


    const result =
        await apiRequest(
            "/scholarships",
            {
                method: "POST",

                body:
                    JSON.stringify(
                        scholarshipData
                    )
            }
        );


    if (!result) {
        return;
    }


    if (!result.success) {

        alert(
            result.message ||
            "Failed to add scholarship."
        );

        return;
    }


    alert(
        "Scholarship added successfully ✅"
    );


    document
        .getElementById(
            "scholarshipForm"
        )
        .reset();


    await loadScholarships();

    updateDashboard();
}


// DELETE SCHOLARSHIP

async function deleteScholarship(
    scholarshipId
) {

    const confirmed =
        confirm(
            "Are you sure you want to delete this scholarship?"
        );


    if (!confirmed) {
        return;
    }


    const result =
        await apiRequest(
            `/scholarships/${scholarshipId}`,
            {
                method: "DELETE"
            }
        );


    if (!result) {
        return;
    }


    if (!result.success) {

        alert(
            result.message ||
            "Failed to delete scholarship."
        );

        return;
    }


    await loadScholarships();

    await loadApplications();

    updateDashboard();

    alert(
        "Scholarship deleted successfully."
    );
}


// ============================================================
// ====================== ELIGIBILITY =========================
// ============================================================

function normalize(value) {

    return String(
        value ?? ""
    )
        .trim()
        .toLowerCase();
}


function arrayContains(
    array,
    value
) {

    if (!Array.isArray(array)) {
        return true;
    }

    if (array.length === 0) {
        return true;
    }

    const target =
        normalize(value);

    return array.some(
        item =>
            normalize(item) === target
    );
}


function evaluateEligibility(
    student,
    scholarship
) {

    const reasons = [];


    // 10th

    if (
        scholarship.min_10th !== null &&
        scholarship.min_10th !== undefined &&
        scholarship.min_10th !== ""
    ) {

        if (
            Number(
                student.percentage_10th || 0
            ) <
            Number(
                scholarship.min_10th
            )
        ) {

            reasons.push(
                `10th percentage below ${scholarship.min_10th}%`
            );

        }

    }


    // 12th

    if (
        scholarship.min_12th !== null &&
        scholarship.min_12th !== undefined &&
        scholarship.min_12th !== ""
    ) {

        if (
            Number(
                student.percentage_12th || 0
            ) <
            Number(
                scholarship.min_12th
            )
        ) {

            reasons.push(
                `12th percentage below ${scholarship.min_12th}%`
            );

        }

    }


    // Income

    if (
        scholarship.max_income !== null &&
        scholarship.max_income !== undefined &&
        scholarship.max_income !== ""
    ) {

        if (
            Number(
                student.family_income || 0
            ) >
            Number(
                scholarship.max_income
            )
        ) {

            reasons.push(
                `Family income exceeds ₹${formatAmount(scholarship.max_income)}`
            );

        }

    }


    // Age

    if (
        scholarship.min_age !== null &&
        scholarship.min_age !== undefined &&
        scholarship.min_age !== ""
    ) {

        if (
            Number(
                student.age || 0
            ) <
            Number(
                scholarship.min_age
            )
        ) {

            reasons.push(
                `Minimum age is ${scholarship.min_age}`
            );

        }

    }


    if (
        scholarship.max_age !== null &&
        scholarship.max_age !== undefined &&
        scholarship.max_age !== ""
    ) {

        if (
            Number(
                student.age || 0
            ) >
            Number(
                scholarship.max_age
            )
        ) {

            reasons.push(
                `Maximum age is ${scholarship.max_age}`
            );

        }

    }


    // Mathematics

    if (
        scholarship.min_math !== null &&
        scholarship.min_math !== undefined &&
        scholarship.min_math !== ""
    ) {

        if (
            Number(
                student.mathematics_percentage || 0
            ) <
            Number(
                scholarship.min_math
            )
        ) {

            reasons.push(
                `Mathematics percentage below ${scholarship.min_math}%`
            );

        }

    }


    // Course

    if (
        Array.isArray(scholarship.eligible_courses) && scholarship.eligible_courses.length > 0 &&
        !arrayContains(
            scholarship.eligible_courses,
            student.course
        )
    ) {

        reasons.push(
            "Course is not eligible"
        );

    }


    // Year

    if (
        Array.isArray(scholarship.eligible_years) && scholarship.eligible_years.length > 0 &&
        !arrayContains(
            scholarship.eligible_years,
            student.academic_year
        )
    ) {

        reasons.push(
            "Academic year is not eligible"
        );

    }


    // Category

    if (
        Array.isArray(scholarship.eligible_categories) && scholarship.eligible_categories.length > 0 &&
        !arrayContains(
            scholarship.eligible_categories,
            student.category
        )
    ) {

        reasons.push(
            "Category is not eligible"
        );

    }


    // Gender

    if (
        Array.isArray(scholarship.eligible_gender) && scholarship.eligible_gender.length > 0 &&
        !arrayContains(
            scholarship.eligible_gender,
            student.gender
        )
    ) {

        reasons.push(
            "Gender is not eligible"
        );

    }


    // State

    if (
        Array.isArray(scholarship.eligible_states) && scholarship.eligible_states.length > 0 &&
        !arrayContains(
            scholarship.eligible_states,
            student.state
        )
    ) {

        reasons.push(
            "State is not eligible"
        );

    }


    // College

    if (
        Array.isArray(scholarship.eligible_colleges) && scholarship.eligible_colleges.length > 0 &&
        !arrayContains(
            scholarship.eligible_colleges,
            student.college
        )
    ) {

        reasons.push(
            "College is not eligible"
        );

    }


    // Admission type

    if (
        Array.isArray(scholarship.eligible_admission_type) && scholarship.eligible_admission_type.length > 0 &&
        !arrayContains(
            scholarship.eligible_admission_type,
            student.admission_type
        )
    ) {

        reasons.push(
            "Admission type is not eligible"
        );

    }


    // Student status

    if (
        Array.isArray(scholarship.eligible_student_status) && scholarship.eligible_student_status.length > 0 &&
        !arrayContains(
            scholarship.eligible_student_status,
            student.student_status
        )
    ) {

        reasons.push(
            "Student status is not eligible"
        );

    }


    // Disability

    const disabilityRequirement =
        normalize(
            scholarship.disability_requirement
        );


    if (
        disabilityRequirement &&
        disabilityRequirement !== "any"
    ) {

        if (
            normalize(
                student.disability
            ) !==
            disabilityRequirement
        ) {

            reasons.push(
                "Disability requirement not satisfied"
            );

        }

    }

    const familyRequirement = normalize(scholarship.family_requirement);
    if (familyRequirement && familyRequirement !== "any" && !normalize(student.special_family_condition).includes(familyRequirement)) {
        reasons.push("Special family condition requirement not satisfied");
    }

    const existingRequirement = normalize(scholarship.existing_scholarship_requirement);
    if (existingRequirement && existingRequirement !== "any") {
        const current = normalize(student.existing_scholarship);
        if ((["none", "no", "not receiving"].includes(existingRequirement) && current && !["none", "no"].includes(current)) ||
            (!(["none", "no", "not receiving"].includes(existingRequirement)) && current !== existingRequirement)) {
            reasons.push("Existing scholarship requirement not satisfied");
        }
    }


    return {

        eligible:
            reasons.length === 0,

        scholarship:
            scholarship,

        reason:
            reasons.length === 0
                ? "Student appears eligible based on the stored criteria."
                : reasons.join("; ")

    };
}


// CHECK ELIGIBILITY

function checkStudentEligibility(
    studentId
) {

    const student =
        students.find(
            item =>
                Number(item.id) ===
                Number(studentId)
        );


    if (!student) {

        alert(
            "Student not found."
        );

        return;
    }


    const results =
        scholarships.map(
            scholarship =>
                evaluateEligibility(
                    student,
                    scholarship
                )
        );


    const eligibleCount =
        results.filter(
            result =>
                result.eligible
        ).length;


    const nameElement =
        document.getElementById(
            "eligibilityStudentName"
        );


    const summaryElement =
        document.getElementById(
            "eligibilitySummary"
        );


    const resultsElement =
        document.getElementById(
            "eligibilityResults"
        );


    if (nameElement) {

        nameElement.textContent =
            student.name;

    }


    if (summaryElement) {

        summaryElement.innerHTML = `

            <strong>
                ${eligibleCount}
            </strong>

            of

            <strong>
                ${scholarships.length}
            </strong>

            scholarships appear eligible based on stored criteria. Eligibility does not guarantee approval.

        `;

    }


    if (resultsElement) {

        if (results.length === 0) {

            resultsElement.innerHTML = `

                <div class="empty-state">

                    <h3>
                        No Scholarships
                    </h3>

                    <p>
                        Add scholarships first.
                    </p>

                </div>

            `;

        } else {

            resultsElement.innerHTML =
                results.map(
                    result => {

                        return `

                        <div
                            class="eligibility-result
                            ${
                                result.eligible
                                    ? "eligible"
                                    : "not-eligible"
                            }"
                        >

                            <div>

                                <h4>
                                    ${escapeHtml(
                                        result.scholarship.name
                                    )}
                                </h4>

                                <p>
                                    ${escapeHtml(
                                        result.reason
                                    )}
                                </p>

                            </div>


                            <div>

                                ${
                                    result.eligible

                                    ?

                                    `
                                    <button
                                        type="button"
                                        class="btn btn-primary"
                                        onclick="
                                            applyForScholarship(
                                                ${student.id},
                                                ${result.scholarship.id}
                                            )
                                        "
                                    >
                                        Apply
                                    </button>
                                    `

                                    :

                                    `
                                    <span class="badge rejected">
                                        Not Eligible
                                    </span>
                                    `
                                }

                            </div>

                        </div>

                        `;

                    }
                ).join("");

        }

    }


    const modal =
        document.getElementById(
            "eligibilityModal"
        );


    if (modal) {

        modal.style.display =
            "flex";

    }
}


// ============================================================
// ====================== APPLICATIONS ========================
// ============================================================


// LOAD APPLICATIONS

async function loadApplications() {

    const result =
        await apiRequest(
            "/applications"
        );


    if (!result) {
        return;
    }


    if (!result.success) {

        console.error(
            result.message
        );

        applications = [];

        renderApplications();

        return;
    }


    applications =
        result.applications || [];


    renderApplications();

    updateDashboard();
}


// RENDER APPLICATIONS

function renderApplications() {

    const container =
        document.getElementById(
            "applicationsList"
        );


    if (!container) {
        return;
    }


    if (applications.length === 0) {

        container.innerHTML = `

            <div class="empty-state">

                <h3>
                    No Applications Yet
                </h3>

                <p>
                    Applications will appear here
                    after applying for scholarships.
                </p>

            </div>

        `;

        return;
    }


    container.innerHTML =
        applications.map(app => {

            return `

                <div class="application-card">


                    <div class="application-header">

                        <div>

                            <h3>
                                ${escapeHtml(
                                    app.student_name
                                )}
                            </h3>

                            <p>
                                ${escapeHtml(
                                    app.scholarship_name
                                )}
                            </p>

                        </div>


                        <span
                            class="badge ${getStatusClass(
                                app.status
                            )}"
                        >
                            ${escapeHtml(
                                app.status
                            )}
                        </span>

                    </div>


                    <div class="application-info">


                        <div>

                            <strong>
                                Provider
                            </strong>

                            <span>
                                ${escapeHtml(
                                    app.scholarship_provider || "-"
                                )}
                            </span>

                        </div>


                        <div>

                            <strong>
                                Amount
                            </strong>

                            <span>
                                ₹${formatAmount(
                                    app.scholarship_amount
                                )}
                            </span>

                        </div>


                        <div>

                            <strong>
                                Applied
                            </strong>

                            <span>
                                ${formatDate(
                                    app.applied_date
                                )}
                            </span>

                        </div>


                    </div>


                    <div class="application-actions">


                        <select
                            onchange="
                                updateApplicationStatus(
                                    ${app.id},
                                    this.value
                                )
                            "
                        >

                            <option
                                value="Pending"
                                ${
                                    app.status === "Pending"
                                        ? "selected"
                                        : ""
                                }
                            >
                                Pending
                            </option>


                            <option
                                value="Submitted"
                                ${
                                    app.status === "Submitted"
                                        ? "selected"
                                        : ""
                                }
                            >
                                Submitted
                            </option>


                            <option
                                value="Under Review"
                                ${
                                    app.status === "Under Review"
                                        ? "selected"
                                        : ""
                                }
                            >
                                Under Review
                            </option>


                            <option
                                value="Selected"
                                ${
                                    app.status === "Selected"
                                        ? "selected"
                                        : ""
                                }
                            >
                                Selected
                            </option>


                            <option
                                value="Rejected"
                                ${
                                    app.status === "Rejected"
                                        ? "selected"
                                        : ""
                                }
                            >
                                Rejected
                            </option>

                        </select>


                        <button
                            type="button"
                            class="btn btn-danger"
                            onclick="
                                deleteApplication(
                                    ${app.id}
                                )
                            "
                        >
                            Delete
                        </button>


                    </div>


                </div>

            `;

        }).join("");
}


// STATUS CLASS

function getStatusClass(status) {

    switch (status) {

        case "Selected":
            return "selected";

        case "Rejected":
            return "rejected";

        case "Submitted":
            return "submitted";

        case "Under Review":
            return "review";

        default:
            return "pending";
    }
}


// APPLY FOR SCHOLARSHIP

async function applyForScholarship(
    studentId,
    scholarshipId
) {

    const result =
        await apiRequest(
            "/applications",
            {
                method: "POST",

                body:
                    JSON.stringify({

                        student_id:
                            studentId,

                        scholarship_id:
                            scholarshipId,

                        status:
                            "Pending"

                    })
            }
        );


    if (!result) {
        return;
    }


    if (!result.success) {

        alert(
            result.message ||
            "Failed to create application."
        );

        return;
    }


    alert(
        "Application added successfully ✅"
    );


    await loadApplications();


    closeModal(
        "eligibilityModal"
    );


    updateDashboard();
}


// UPDATE STATUS

async function updateApplicationStatus(
    applicationId,
    status
) {

    const result =
        await apiRequest(
            `/applications/${applicationId}/status`,
            {
                method: "PATCH",

                body:
                    JSON.stringify({
                        status: status
                    })
            }
        );


    if (!result) {
        return;
    }


    if (!result.success) {

        alert(
            result.message ||
            "Failed to update application."
        );

        return;
    }


    await loadApplications();

    updateDashboard();
}


// DELETE APPLICATION

async function deleteApplication(
    applicationId
) {

    const confirmed =
        confirm(
            "Delete this application?"
        );


    if (!confirmed) {
        return;
    }


    const result =
        await apiRequest(
            `/applications/${applicationId}`,
            {
                method: "DELETE"
            }
        );


    if (!result) {
        return;
    }


    if (!result.success) {

        alert(
            result.message ||
            "Failed to delete application."
        );

        return;
    }


    await loadApplications();

    updateDashboard();

    alert(
        "Application deleted successfully."
    );
}


// ============================================================
// SCHOLARSHIP DETAILS
// ============================================================

function openScholarshipDetails(
    scholarshipId
) {

    const scholarship =
        scholarships.find(
            item =>
                Number(item.id) ===
                Number(scholarshipId)
        );


    if (!scholarship) {

        alert(
            "Scholarship not found."
        );

        return;
    }


    setText(
        "detailStatus",
        scholarship.status || "Open"
    );


    setText(
        "detailScholarshipName",
        scholarship.name || "-"
    );


    setText(
        "detailProvider",
        scholarship.provider || "-"
    );


    setText(
        "detailAmount",
        `₹${formatAmount(
            scholarship.amount
        )}`
    );


    setText(
        "detailDeadline",
        formatDate(
            scholarship.deadline
        )
    );


    setText(
        "detailVerified",
        scholarship.last_verified
            ? formatDate(
                scholarship.last_verified
            )
            : "Not verified"
    );


    const eligibleStudents =
        students.filter(
            student =>
                evaluateEligibility(
                    student,
                    scholarship
                ).eligible
        );


    const scholarshipApplications =
        applications.filter(
            app =>
                Number(
                    app.scholarship_id
                ) ===
                Number(
                    scholarshipId
                )
        );


    setText(
        "detailEligibleStudents",
        eligibleStudents.length
    );


    setText(
        "detailApplications",
        scholarshipApplications.length
    );


    const eligibilityElement =
        document.getElementById(
            "detailEligibility"
        );


    if (eligibilityElement) {

        eligibilityElement.innerHTML =
            buildEligibilityDetails(
                scholarship
            );

    }


    setText(
        "detailDocuments",
        scholarship.required_documents ||
        "Not specified"
    );


    setText(
        "detailSelection",
        scholarship.selection_process ||
        "Not specified"
    );


    setText(
        "detailRenewal",
        scholarship.renewal_conditions ||
        "Not specified"
    );


    setText(
        "detailNotes",
        scholarship.notes ||
        "No notes"
    );


    const modal =
        document.getElementById(
            "scholarshipDetailModal"
        );


    if (modal) {

        modal.style.display =
            "flex";

    }
}


// SET TEXT

function setText(
    elementId,
    value
) {

    const element =
        document.getElementById(
            elementId
        );


    if (element) {

        element.textContent =
            value;

    }
}


// BUILD ELIGIBILITY DETAILS

function buildEligibilityDetails(
    scholarship
) {

    const items = [];


    if (
        scholarship.min_10th !== null &&
        scholarship.min_10th !== undefined
    ) {

        items.push(
            `Minimum 10th: ${scholarship.min_10th}%`
        );

    }


    if (
        scholarship.min_12th !== null &&
        scholarship.min_12th !== undefined
    ) {

        items.push(
            `Minimum 12th: ${scholarship.min_12th}%`
        );

    }


    if (
        scholarship.min_math !== null &&
        scholarship.min_math !== undefined
    ) {

        items.push(
            `Minimum Mathematics: ${scholarship.min_math}%`
        );

    }


    if (
        scholarship.max_income !== null &&
        scholarship.max_income !== undefined
    ) {

        items.push(
            `Maximum Income: ₹${formatAmount(
                scholarship.max_income
            )}`
        );

    }


    if (
        scholarship.min_age !== null &&
        scholarship.min_age !== undefined
    ) {

        items.push(
            `Minimum Age: ${scholarship.min_age}`
        );

    }


    if (
        scholarship.max_age !== null &&
        scholarship.max_age !== undefined
    ) {

        items.push(
            `Maximum Age: ${scholarship.max_age}`
        );

    }


    addArrayCriteria(
        items,
        "Courses",
        scholarship.eligible_courses
    );


    addArrayCriteria(
        items,
        "Academic Years",
        scholarship.eligible_years
    );


    addArrayCriteria(
        items,
        "Categories",
        scholarship.eligible_categories
    );


    addArrayCriteria(
        items,
        "Gender",
        scholarship.eligible_gender
    );


    addArrayCriteria(
        items,
        "States",
        scholarship.eligible_states
    );


    addArrayCriteria(
        items,
        "Colleges",
        scholarship.eligible_colleges
    );


    addArrayCriteria(
        items,
        "Admission Type",
        scholarship.eligible_admission_type
    );


    addArrayCriteria(
        items,
        "Student Status",
        scholarship.eligible_student_status
    );


    if (items.length === 0) {

        return `
            <p>
                No specific eligibility criteria entered.
            </p>
        `;

    }


    return `

        <ul>

            ${items.map(
                item =>
                    `<li>${escapeHtml(item)}</li>`
            ).join("")}

        </ul>

    `;
}


function addArrayCriteria(
    items,
    label,
    value
) {

    if (
        Array.isArray(value) &&
        value.length > 0
    ) {

        items.push(
            `${label}: ${value.join(", ")}`
        );

    }
}


// ============================================================
// MODALS
// ============================================================

function closeModal(
    modalId
) {

    const modal =
        document.getElementById(
            modalId
        );


    if (modal) {

        modal.style.display =
            "none";

    }
}


// CLOSE MODAL ON OUTSIDE CLICK

function setupModalListeners() {

    window.addEventListener(
        "click",
        function(event) {

            const eligibilityModal =
                document.getElementById(
                    "eligibilityModal"
                );


            const scholarshipModal =
                document.getElementById(
                    "scholarshipDetailModal"
                );


            if (
                eligibilityModal &&
                event.target ===
                eligibilityModal
            ) {

                eligibilityModal.style.display =
                    "none";

            }


            if (
                scholarshipModal &&
                event.target ===
                scholarshipModal
            ) {

                scholarshipModal.style.display =
                    "none";

            }

        }
    );
}


// ============================================================
// DASHBOARD
// ============================================================

function updateDashboard() {

    const studentsElement =
        document.getElementById(
            "totalStudents"
        );


    const scholarshipsElement =
        document.getElementById(
            "totalScholarships"
        );


    const applicationsElement =
        document.getElementById(
            "totalApplications"
        );


    const openElement =
        document.getElementById(
            "openScholarships"
        );


    if (studentsElement) {

        studentsElement.textContent =
            students.length;

    }


    if (scholarshipsElement) {

        scholarshipsElement.textContent =
            scholarships.length;

    }


    if (applicationsElement) {

        applicationsElement.textContent =
            applications.length;

    }


    if (openElement) {

        openElement.textContent =
            scholarships.filter(
                scholarship =>
                    String(
                        scholarship.status || "Open"
                    ).toLowerCase() ===
                    "open"
            ).length;

    }
}


// ============================================================
// FORM LISTENERS
// ============================================================

function setupForms() {

    const studentForm =
        document.getElementById(
            "studentForm"
        );


    if (studentForm) {

        studentForm.addEventListener(
            "submit",
            addStudent
        );

    }


    const scholarshipForm =
        document.getElementById(
            "scholarshipForm"
        );


    if (scholarshipForm) {

        scholarshipForm.addEventListener(
            "submit",
            addScholarship
        );

    }
}


// ============================================================
// INITIALIZE APP
// ============================================================

async function initializeApp() {

    console.log(
        "🚀 ScholarGuide frontend starting..."
    );


    loadUserInfo();

    setupNavigation();

    setupForms();

    setupModalListeners();


    // Dashboard visible by default

    showSection(
        "dashboard"
    );


    // Load database data

    await loadStudents();

    await loadScholarships();

    await loadApplications();


    updateDashboard();


    console.log(
        "✅ ScholarGuide frontend loaded"
    );
}


// ============================================================
// START
// ============================================================

document.addEventListener(
    "DOMContentLoaded",
    initializeApp
);
