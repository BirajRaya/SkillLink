const express = require("express");
const { Signin, Signup } = require("../controllers/authController");

const router = express.Router();

router.post("/signup", Signup);
router.post("/signin", Signin);

module.exports = router;