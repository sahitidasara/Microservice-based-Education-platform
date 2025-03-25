const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const contentController = require('../controllers/content');

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, process.env.UPLOAD_DIR),
    filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`)
});


const upload = multer({
    storage,
    limits: { fileSize: 100 * 1024 * 1024 }, // 100MB limit
    fileFilter: (req, file, cb) => {
        const allowedExtensions = /\.(mp4|pdf|txt|jpeg|jpg|png|doc|docx)$/i;
        const allowedMimeTypes = [
            'video/mp4',
            'application/pdf',
            'text/plain',
            'image/jpeg',
            'image/png',
            'application/msword', // .doc
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document' // .docx
        ];

        const extname = path.extname(file.originalname).toLowerCase();
        const mimetype = file.mimetype;

        if (allowedExtensions.test(extname) && allowedMimeTypes.includes(mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Only .mp4, .pdf, .txt, .jpeg, .jpg, .png, .doc, and .docx files are allowed'));
        }
    }
});


// Routes
router.post('/', upload.single('file'), contentController.uploadContent);
router.get('/course/:courseId', contentController.getCourseContent);
router.get('/stream/:id', contentController.streamVideoContent);
router.get('/file/:id', contentController.serveStaticContent);
router.delete('/:id', contentController.deleteContent);

module.exports = router;