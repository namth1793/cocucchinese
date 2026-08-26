const express = require('express');
const db = require('../db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// Số liệu tổng quan kho học liệu - đếm thật từ dữ liệu, không phải số cố định.
router.get('/overview', requireAuth, (req, res) => {
  res.json({
    levels: db.all('levels').length,
    lessons: db.all('lessons').length,
    words: db.all('words').length,
    sentences: db.all('sentences').length
  });
});

module.exports = router;
