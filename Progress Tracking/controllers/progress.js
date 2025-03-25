const Progress = require('../models/Progress');
const amqplib = require('amqplib');

// @desc Initiate a progress document for a user
// @route POST /api/v1/progress/init
// @access Public
const initProgress = async (req, res) => {
    const { userId } = req.body;
    try {
        let progress = await Progress.findOne({ userId });
        if (!progress) {
            progress = new Progress({ userId, registeredCourses: [], courses: [] });
            await progress.save();
        }
        res.status(201).json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// @desc  Get course progress
// @route GET /api/v1/progress/course/:courseId
// @access Public
const getCourseProgress = async (req, res) => {
    try {
        const progress = await Progress.find({ courseId: req.params.courseId });
        res.json({
            completedContents: progress.flatMap(p => p.completedContents),
            registeredUsers: progress.map(p => p.userId)
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// @desc  Get User progress
// @route GET /api/v1/progress/user/:userId
// @access Public
const getUserProgress = async (req, res) => {
    try {
        const { userId } = req.params;
        const progress = await Progress.findOne({ userId }) || { userId, registeredCourses: [], courses: [] };
        res.json(progress);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// @desc  Register for a course
// @route GET /api/v1/progress/register
// @access Public
const registerCourse = async (req, res) => {
    try {
        const { userId, courseId } = req.body;
        let progress = await Progress.findOne({ userId });

        if (!progress) {
            progress = new Progress({ userId, registeredCourses: [], courses: [] });
        }

        if (!progress.registeredCourses.includes(courseId)) {
            progress.registeredCourses.push(courseId);
            progress.courses.push({ courseId, completedContents: [] });
            await progress.save();
        }
        res.json(progress);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// @desc  Update course progress
// @route POST /api/v1/progress
// @access Public
const updateProgress = async (req, res) => {
    try {
        const { userId, courseId, contentId } = req.body;
        let progress = await Progress.findOne({ userId });

        if (!progress) {
            progress = new Progress({ userId, registeredCourses: [courseId], courses: [{ courseId, completedContents: [] }] });
        }

        if (!progress.registeredCourses.includes(courseId)) {
            progress.registeredCourses.push(courseId);
            progress.courses.push({ courseId, completedContents: [] });
        }

        const courseProgress = progress.courses.find(c => c.courseId.toString() === courseId.toString());
        if (courseProgress && !courseProgress.completedContents.includes(contentId)) {
            courseProgress.completedContents.push(contentId);
        }
        await progress.save();
        res.json(progress);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// @desc  Drop a couse
// @route DELETE /api/v1/progress
// @access Public
const dropCourse = async (req, res) => {
    const { userId, courseId } = req.body;
    try {
        const progress = await Progress.findOne({ userId });
        if (!progress) {
            return res.status(404).json({ error: 'User progress not found' });
        }

        // Remove course from registeredCourses
        progress.registeredCourses = progress.registeredCourses.filter(
            id => id.toString() !== courseId.toString()
        );

        // Remove course progress
        progress.courses = progress.courses.filter(
            course => course.courseId.toString() !== courseId.toString()
        );

        await progress.save();
        res.status(200).json({ success: true });
    } catch (error) {
        console.error('Error dropping course:', error);
        res.status(500).json({ error: error.message });
    }
};

// Consumers unchanged
const setupConsumers = async () => {
    const conn = await amqplib.connect(process.env.RABBITMQ_URL);
    const channel = await conn.createChannel();
    const userQueue = 'user_login';
    const courseQueue = 'course_created_progress';
    await channel.assertQueue(userQueue, { durable: false });
    await channel.assertQueue(courseQueue, { durable: false });

    channel.consume(userQueue, async (msg) => {
        const { userId } = JSON.parse(msg.content.toString());
        console.log(`User logged in: ${userId}`);
        channel.ack(msg);
    });

    channel.consume(courseQueue, async (msg) => {
        const { courseId } = JSON.parse(msg.content.toString());
        console.log(`New course created: ${courseId}`);
        channel.ack(msg);
    });
};

setupConsumers();

module.exports = { initProgress, getUserProgress, registerCourse, updateProgress, getCourseProgress, dropCourse };