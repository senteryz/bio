const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'web2026'; // Default password
const ADMIN_ROUTE = process.env.ADMIN_ROUTE || '/control'; // Секретный путь к админ-панели (поменяйте на любой скрытый)

app.use(express.json({ limit: '10mb' })); // support base64 uploads for portfolio photos
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Helper functions to read/write JSON files
const getFilePath = (filename) => path.join(__dirname, 'data', filename);

const readJSON = (filename) => {
  try {
    const data = fs.readFileSync(getFilePath(filename), 'utf8');
    return JSON.parse(data);
  } catch (e) {
    console.error(`Error reading ${filename}:`, e);
    return [];
  }
};

const writeJSON = (filename, data) => {
  try {
    fs.writeFileSync(getFilePath(filename), JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (e) {
    console.error(`Error writing ${filename}:`, e);
    return false;
  }
};

// API: Get all dynamic data
app.get('/api/get-data', (req, res) => {
  res.json({
    pricing: readJSON('pricing.json'),
    portfolio: readJSON('portfolio.json'),
    privacy: readJSON('privacy.json')
  });
});

// API: Verify Admin Password
app.post('/api/verify-login', (req, res) => {
  const { password } = req.body;
  if (password === ADMIN_PASSWORD) {
    res.json({ success: true, token: 'session_' + Buffer.from(ADMIN_PASSWORD).toString('base64') });
  } else {
    res.status(401).json({ success: false, error: 'Неверный пароль' });
  }
});

// API: Save dynamic data
app.post('/api/save-data', (req, res) => {
  const { password, type, data } = req.body;
  
  if (password !== ADMIN_PASSWORD) {
    return res.status(401).json({ success: false, error: 'Доступ запрещен. Неверный пароль.' });
  }

  if (!['pricing', 'portfolio', 'privacy'].includes(type)) {
    return res.status(400).json({ success: false, error: 'Неверный тип данных' });
  }

  const success = writeJSON(`${type}.json`, data);
  if (success) {
    res.json({ success: true, message: 'Данные успешно сохранены' });
  } else {
    res.status(500).json({ success: false, error: 'Ошибка записи на сервере' });
  }
});

// Serving static files (index.html, css, js, images)
app.use(express.static(__dirname));

// Direct admin panel access
app.get(ADMIN_ROUTE, (req, res) => {
  res.sendFile(path.join(__dirname, 'panel.html'));
});

// Fallback to index.html for undefined routes
app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`[Студия Кода] Сервер успешно запущен на порту ${PORT}`);
  console.log(`[INFO] Секретный адрес входа в панель: http://localhost:${PORT}${ADMIN_ROUTE}`);
  console.log(`[INFO] Пароль администратора по умолчанию: ${ADMIN_PASSWORD}`);
  console.log(`====================================================`);
});
