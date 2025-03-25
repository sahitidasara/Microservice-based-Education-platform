const mongoose = require('mongoose');

const progressSchema = new mongoose.Schema({
    userId: { type: String, required: true, unique: true },
    registeredCourses: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Course' }],
    courses: [{
        courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course' },
        completedContents: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Content' }]
    }]
});

module.exports = mongoose.model('Progress', progressSchema);