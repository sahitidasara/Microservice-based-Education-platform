const express = require("express");
const { getCourses, addCourse, deleteCourse } = require("../controllers/courses");

const router = express.Router();

router.route("/").get(getCourses).post(addCourse);
router.route("/:id").delete(deleteCourse);

module.exports = router;