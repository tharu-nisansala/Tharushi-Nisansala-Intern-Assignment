
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const session = require('express-session');
const passport = require('passport');
require('./passport'); 
const Student = require('./models/Student');
const multer = require('multer');
const path = require('path');
const authRoute = require("./routes/auth");
const adminModel = require("./models/admin");

const app = express();
app.use(express.json());
app.use(cors({
  origin: "http://localhost:5173", 
  methods: "GET,POST,PUT,DELETE",
  credentials: true,
}));

// Setup session
app.use(session({
  secret: 'cyberwolve_secret',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false }, // Change to `true` if using HTTPS
}));

// Initialize passport
app.use(passport.initialize());
app.use(passport.session());

// MongoDB Connection
mongoose.connect("mongodb+srv://nisansalatharushi28:dbuser123@cluster0.wpx9g.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0")
.then(() => console.log("MongoDB connected"))
.catch((err) => console.error("MongoDB connection error:", err));

// Multer configuration for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname)); // Unique filename
  }
});
const upload = multer({ storage });

// Serve static files (images)
app.use('/uploads', express.static('uploads'));

// Get all students
app.get('/api/students', async (req, res) => {
  try {
    const students = await Student.find();
    res.json(students);
  } catch (err) {
    res.status(500).send('Error fetching students');
  }
});

// Get a student by ID
app.get('/api/students/:id', async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    res.json(student);
  } catch (err) {
    res.status(500).send('Error fetching student');
  }
});

// Add a new student
app.post('/api/students', upload.single('image'), async (req, res) => {
  const { name, age, status } = req.body;
  const newStudent = new Student({
    name,
    image: req.file ? req.file.path : null, // Save image path (if uploaded)
    age,
    status,
  });

  try {
    await newStudent.save();
    res.status(201).send("Student added successfully");
  } catch (err) {
    res.status(500).send("Error adding student");
  }
});

// Update a student
app.put('/api/students/:id', upload.single('image'), async (req, res) => {
  const { name, age, status } = req.body;
  const updateData = { name, age, status };

  if (req.file) {
    updateData.image = req.file.path;
  }

  try {
    await Student.findByIdAndUpdate(req.params.id, updateData);
    res.status(200).send('Student updated successfully');
  } catch (err) {
    res.status(500).send('Error updating student');
  }
});

// Delete a student
app.delete('/api/students/:id', async (req, res) => {
  try {
    await Student.findByIdAndDelete(req.params.id);
    res.status(200).send('Student deleted successfully');
  } catch (err) {
    res.status(500).send('Error deleting student');
  }
});
// Login route
app.post("/login", (req, res) => {
  const { username, password } = req.body;
  adminModel
    .findOne({ username: username })
    .then((user) => {
      if (user) {
        if (user.password === password) {
          res.json("success");
        } else {
          res.json("The password is incorrect");
        }
      } else {
        res.json("No record exists");
      }
    })
    .catch((err) => res.status(500).json({ error: err.message }));
});
// Register route
app.post("/register", (req, res) => {
  adminModel
    .create(req.body)
    .then((admin) => res.json(admin))
    .catch((err) => res.status(500).json({ error: err.message }));
});

// Auth routes
app.use("/auth", authRoute);

// Start the server
app.listen(3001, () => {
  console.log('Server is running on port 3001');
});
