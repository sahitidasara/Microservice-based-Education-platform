const Course = require('../models/Course');
const amqplib = require('amqplib');
const axios = require('axios');

// @desc  Add a course
// @route POST /api/v1/courses
// @access Public

const addCourse = async (req, res) => {
  try {
    const course = new Course(req.body);
    await course.save();

    const conn = await amqplib.connect(process.env.RABBITMQ_URL);
    const channel = await conn.createChannel();
    const contentQueue = 'course_created_content';
    const progressQueue = 'course_created_progress';
    await channel.assertQueue(contentQueue, { durable: false });
    await channel.assertQueue(progressQueue, { durable: false });
    const message = JSON.stringify({ courseId: course._id });
    channel.sendToQueue(contentQueue, Buffer.from(message));
    channel.sendToQueue(progressQueue, Buffer.from(message));
    setTimeout(() => conn.close(), 500);

    res.status(201).json({ success: true, data: course });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};


// @desc  Get all courses
// @route GET /api/v1/courses
// @access Public
const getCourses = async (req, res) => {
  try {
    const courses = await Course.find();
    const token = req.headers.authorization; // Pass token from frontend
    const coursesWithContent = await Promise.all(
      courses.map(async (course) => {
        try {
          const contentResponse = await axios.get(`http://localhost:3003/api/v1/content/course/${course._id}`);
          //fetch progress
          const progressResponse = await axios.get(`http://localhost:6050/api/v1/progress/course/${course._id}`, {
            headers: { Authorization: token }
          });
          const progressData = 
          progressResponse.data || 
          { completedContents: [], registeredUsers: [] };
          return {
            ...course._doc,
            contents: contentResponse.data || [],
            progress: progressData
          };
        } catch (error) {
          console.error(`Failed to fetch data for course ${course._id}:`, error.message);
          return { ...course._doc, contents: [], progress: { completedContents: [], registeredUsers: [] } };
        }
      })
    );
    res.json({ success: true, count: coursesWithContent.length, data: coursesWithContent });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// @desc Delete a course
// @route DELETE /api/v1/course/:id
// @access Public
const deleteCourse = async (req, res) => {
    try {
      const course = await Course.findByIdAndDelete(req.params.id);
      if (!course) return res.status(404).json({ error: 'Course not found' });
      res.status(200).json({ success: true });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };

module.exports = { addCourse, getCourses,deleteCourse };