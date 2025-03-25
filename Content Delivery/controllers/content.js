const jwt = require('jsonwebtoken');
const path = require('path');
const fs = require('fs');
const Content = require('../models/Content');
const amqp = require('amqplib');
const mammoth = require('mammoth'); // For .docx
const textract = require('textract'); // For .doc


// Consumer for course creation events
const startConsumer = async () => {
    const connection = await amqp.connect(process.env.RABBITMQ_URL);
    const channel = await connection.createChannel();
    const queue = 'course_created_content';
    await channel.assertQueue(queue, { durable: false });
    channel.consume(queue, async (msg) => {
        const { courseId } = JSON.parse(msg.content.toString());
        console.log(`Content Service: New course created with ID ${courseId}`);
        channel.ack(msg);
    });
};


// @desc  Upload content
// @route POST /api/v1/content
// @access Public
const uploadContent = async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (decoded.role !== 'admin') {
            return res.status(403).json({ error: 'Only admins can upload content' });
        }

        const { courseId, title } = req.body;
        const file = req.file;
        const ext = path.extname(file.filename).toLowerCase().slice(1);
        const typeMap = {
            'mp4': 'video',
            'pdf': 'pdf',
            'jpeg': 'image',
            'jpg': 'image',
            'png': 'image',
            'txt': 'text',
            'doc': 'text',
            'docx': 'text'
        };
        const contentType = typeMap[ext];
        if (!contentType) throw new Error('Unsupported file type');

        const content = new Content({
            courseId,
            title,
            type: contentType,
            filePath: file.path
        });
        await content.save();
        res.status(201).json(content);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// @desc  Get content
// @route GET /api/v1/course/:courseId
// @access Public
const getCourseContent = async (req, res) => {
    try {
        const contents = await Content.find({ courseId: req.params.courseId });
        const contentsWithSize = contents.map(content => ({
            ...content._doc,
            size: fs.statSync(content.filePath).size
        }));
        res.json(contentsWithSize);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// @desc  Stream video content
// @route GET /api/v1/stream/:id
// @access Public
const streamVideoContent = async (req, res) => {
    try {
        const content = await Content.findById(req.params.id);
        if (!content || content.type !== 'video') {
            return res.status(404).json({ error: 'Video not found' });
        }

        const filePath = path.resolve(content.filePath);
        const stat = fs.statSync(filePath);
        const fileSize = stat.size;
        const range = req.headers.range;

        if (range) {
            const parts = range.replace(/bytes=/, '').split('-');
            const start = parseInt(parts[0], 10);
            const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
            const chunksize = (end - start) + 1;
            const file = fs.createReadStream(filePath, { start, end });
            const head = {
                'Content-Range': `bytes ${start}-${end}/${fileSize}`,
                'Accept-Ranges': 'bytes',
                'Content-Length': chunksize,
                'Content-Type': 'video/mp4'
            };
            res.writeHead(206, head);
            file.pipe(res);
        } else {
            const head = {
                'Content-Length': fileSize,
                'Content-Type': 'video/mp4'
            };
            res.writeHead(200, head);
            fs.createReadStream(filePath).pipe(res);
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// @desc  Display the text file
// @route GET /api/v1/file/:id
// @access Public
const serveStaticContent = async (req, res) => {
    try {
        const content = await Content.findById(req.params.id);
        if (!content) {
            console.error(`Content not found for ID: ${req.params.id}`);
            return res.status(404).json({ error: 'Content not found' });
        }

        const filePath = path.resolve(content.filePath);
        if (!fs.existsSync(filePath)) {
            console.error(`File not found at: ${filePath}`);
            return res.status(404).json({ error: 'File not found on server' });
        }

        console.log(`Serving content: ${content.type} from ${filePath}`);
        if (content.type === 'image') {
            res.setHeader('Content-Type', `image/${path.extname(filePath).slice(1)}`);
            fs.createReadStream(filePath).pipe(res);
        } else if (content.type === 'text') {
            const ext = path.extname(filePath).toLowerCase();
            if (ext === '.txt') {
                const text = fs.readFileSync(filePath, 'utf8');
                res.setHeader('Content-Type', 'text/plain');
                res.send(text);
            } else if (ext === '.docx') {
                const result = await mammoth.extractRawText({ path: filePath });
                res.setHeader('Content-Type', 'text/plain');
                res.send(result.value);
            } else if (ext === '.doc') {
                textract.fromFileWithPath(filePath, (error, text) => {
                    if (error) {
                        console.error('Error extracting .doc text:', error);
                        return res.status(500).json({ error: 'Failed to extract .doc content' });
                    }
                    res.setHeader('Content-Type', 'text/plain');
                    res.send(text || 'No text extracted');
                });
            } else {
                res.status(400).json({ error: 'Unsupported text file format' });
            }
        } else if (content.type === 'pdf') {
            res.setHeader('Content-Type', 'application/pdf');
            fs.createReadStream(filePath).pipe(res);
        } else {
            res.status(400).json({ error: 'Unsupported content type for this endpoint' });
        }
    } catch (error) {
        console.error(`Error serving content ${req.params.id}:`, error);
        res.status(500).json({ error: error.message });
    }
};


// @desc  Delete content
// @route DELETE /api/v1/content/:id
// @access Public
const deleteContent = async (req, res) => {
    try {
        const content = await Content.findById(req.params.id);
        if (!content) return res.status(404).json({ error: 'Content not found' });
        fs.unlinkSync(content.filePath); // Delete file from disk
        await Content.findByIdAndDelete(req.params.id);
        res.status(200).json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

startConsumer();


module.exports = {
    uploadContent,
    getCourseContent,
    streamVideoContent,
    serveStaticContent,
    deleteContent
};