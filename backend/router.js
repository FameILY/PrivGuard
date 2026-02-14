const router = require('express').Router();
const textController = require('./controllers/textController');
const multer = require("multer");

const upload = multer(); // parses multipart/form-data
router.get('/', (req, res) => {
  res.send('Backend is bhaaging 🏃‍♂️🏃‍♂️🏃‍♂️');
});

router.post('/text', upload.single("file"), textController.redactText);

module.exports = router;