const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
dotenv.config();
const app = express();
app.use(cors());

app.use(express.json());

app.get('/', (req, res) => {
  res.send('Backend is bhaaging 🏃‍♂️🏃‍♂️🏃‍♂️');
});


app.listen(process.env.port, () => {
  console.log(`Server is running on port ${process.env.port}`);
});
