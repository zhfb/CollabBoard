const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/auth', require('./routes/auth'));
app.use('/api/boards', require('./routes/boards'));

// 健康检查路由
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'CollabBoard backend is running!' });
});

module.exports = app;