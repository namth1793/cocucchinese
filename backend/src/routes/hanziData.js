const express = require('express');
const fs = require('fs');
const path = require('path');

const router = express.Router();
const DATA_DIR = path.join(__dirname, '..', '..', 'node_modules', 'hanzi-writer-data');

// Phục vụ dữ liệu thứ tự nét (gói hanzi-writer-data) qua chính backend thay vì
// để trình duyệt gọi thẳng ra CDN jsdelivr — hoạt động cả khi máy không có
// Internet hoặc mạng công ty/trường học chặn CDN ngoài.
router.get('/:char', (req, res) => {
  const filePath = path.join(DATA_DIR, `${req.params.char}.json`);
  if (!filePath.startsWith(DATA_DIR + path.sep)) {
    return res.status(400).json({ error: 'Ký tự không hợp lệ' });
  }
  fs.readFile(filePath, 'utf-8', (err, data) => {
    if (err) return res.status(404).json({ error: 'Không có dữ liệu nét cho chữ này' });
    res.set('Cache-Control', 'public, max-age=604800').type('application/json').send(data);
  });
});

module.exports = router;
