const path = require("path");
const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const connectDB = require("./config/db");

// load env vars
dotenv.config({ path: "./config/config.env" });

// Connect to database
connectDB();

const app = express();

// Body parser
app.use(express.json());

// Enable cors
//app.use(cors({ origin: 'http://localhost:8081' }));
app.use(cors({
  origin: 'http://localhost:8080', // Frontend origin
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// Set static folder
app.use(express.static(path.join(__dirname, "public")));

// Routes
app.use("/api/v1/login", require("./routes/login"));
app.use("/api/v1/users", require("./routes/users"));

const PORT = process.env.PORT || 5000;

app.listen(PORT, () =>
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`)
);
