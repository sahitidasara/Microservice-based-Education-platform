const express = require("express");
const { getUsers, addUser } = require("../controllers/users");


const router = express.Router();

router.route("/").get(getUsers).post(addUser);

router.get("/me", (req, res) => {
  if (req.session.email) {
    // Assuming email is stored in the session
    res.json({ email: req.session.email });
  } else {
    res.status(401).json({ error: "User not logged in" });
  }
});

module.exports = router;