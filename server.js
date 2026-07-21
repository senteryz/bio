const express = require('express');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const https = require('https');

const app = express();
const PORT = process.env.PORT || 3000;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'web2026';
const ADMIN_ROUTE = process.env.ADMIN_ROUTE || '/control-vault-98a7x2'; // Сверхсекретный зашифрованный путь

// Server Security Secrets (Генерация 256-битного секретного ключа сессий)
const SERVER_SESSION_SECRET = process.env.SESSION_SECRET || crypto.randomBytes(32).toString('hex');
const PASSWORD_SALT = 'code_studio_salt_2026_x89a';

// PBKDF2 Password Hashing (100 000 итераций SHA-512)
function hashPassword(password) {
  return crypto.pbkdf2Sync(password, PASSWORD_SALT, 100000, 64, 'sha512').toString('hex');
}
const HASHED_ADMIN_PASSWORD = hashPassword(ADMIN_PASSWORD);

// HMAC Token Generator & Verifier
function generateSessionToken() {
  const expiresAt = Date.now() + 2 * 3600 * 1000; // Сессия на 2 часа
  const payload = `admin_${expiresAt}`;
  const signature = crypto.createHmac('sha256', SERVER_SESSION_SECRET).update(payload).digest('hex');
  return `${payload}.${signature}`;
}

function verifySessionToken(token) {
  if (!token || typeof token !== 'string') return false;
  const parts = token.split('.');
  if (parts.length !== 2) return false;
  
  const [payload, signature] = parts;
  const expectedSig = crypto.createHmac('sha256', SERVER_SESSION_SECRET).update(payload).digest('hex');
  
  // Timing-safe verification to prevent timing attacks
  if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSig))) {
    return false;
  }

  const expiresAt = parseInt(payload.replace('admin_', ''), 10);
  if (isNaN(expiresAt) || Date.now() > expiresAt) {
    return false; // Токен истек
  }
  return true;
}

// Anti-Brute-Force Protection (Защита от подбора пароля)
const loginAttempts = new Map();

function isIpBlocked(ip) {
  const record = loginAttempts.get(ip);
  if (!record) return false;
  if (Date.now() > record.blockedUntil) {
    loginAttempts.delete(ip);
    return false;
  }
  return true;
}

function recordFailedAttempt(ip) {
  const record = loginAttempts.get(ip) || { count: 0, blockedUntil: 0 };
  record.count += 1;
  if (record.count >= 5) {
    record.blockedUntil = Date.now() + 15 * 60 * 1000; // Блокировка на 15 минут
    console.warn(`[БЕЗОПАСНОСТЬ] IP ${ip} заблокирован за 5 неверных попыток входа!`);
  }
  loginAttempts.set(ip, record);
}

// Security Headers Middleware
app.use((req, res, next) => {
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.removeHeader('X-Powered-By');
  next();
});

app.use(express.json({ limit: '10mb' }));
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

// API: Verify Admin Password (With Anti-Brute-Force & PBKDF2)
app.post('/api/verify-login', (req, res) => {
  const clientIp = req.ip || req.connection.remoteAddress || 'unknown';

  if (isIpBlocked(clientIp)) {
    return res.status(429).json({ success: false, error: 'Слишком много неверных попыток. Вход заблокирован на 15 минут.' });
  }

  const { password } = req.body;
  const inputHash = hashPassword(password || '');

  // Artificial latency against timing side-channel attacks
  setTimeout(() => {
    if (inputHash === HASHED_ADMIN_PASSWORD) {
      loginAttempts.delete(clientIp);
      const token = generateSessionToken();
      res.json({ success: true, token: token });
    } else {
      recordFailedAttempt(clientIp);
      res.status(401).json({ success: false, error: 'Неверный пароль администратора' });
    }
  }, 800);
});

// API: Save dynamic data (Protected by HMAC Token Verification)
app.post('/api/save-data', (req, res) => {
  const { password, token, type, data } = req.body;
  
  // Verify either signed token or valid hashed password
  const isValidToken = verifySessionToken(token);
  const isValidPass = password && hashPassword(password) === HASHED_ADMIN_PASSWORD;

  if (!isValidToken && !isValidPass) {
    return res.status(401).json({ success: false, error: 'Доступ запрещен. Ошибка авторизации.' });
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

// VK API Notifications Settings
const VK_GROUP_TOKEN = process.env.VK_GROUP_TOKEN || 'vk1.a.vwX_lLUThZyWuMsIZSvw-56_TxHMrEiqzACzTYGIDc6cnFZZBA6vvrfHMVDzeLTftrapKq2E1gkYXbbUp2L9eVYzAOgNcd0KKXL0-XYtUTFo-zpn429ZPVJJ74vU_AeDOSkYfjv72eqgYE3JoN-lSVOLzDOFWfO9bDtzO7ynERLppcyjfClcds9uCMhHIwyaiyJUES9NYWVgrToVERnJHw';
const VK_USER_ID = process.env.VK_USER_ID || '550394386'; // Ваш личный VK ID (куда высылать заявки)

function sendVKNotification(text) {
  if (!VK_GROUP_TOKEN || !VK_USER_ID) {
    console.log('[VK API] Уведомление на сервере (задайте VK_GROUP_TOKEN и VK_USER_ID в env):\n', text);
    return Promise.resolve(false);
  }

  const params = new URLSearchParams({
    user_id: VK_USER_ID,
    peer_id: VK_USER_ID,
    message: text,
    random_id: Math.floor(Math.random() * 1000000000),
    access_token: VK_GROUP_TOKEN,
    v: '5.131'
  });

  const url = 'https://api.vk.com/method/messages.send?' + params.toString();

  return new Promise((resolve) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (json.response) {
            console.log('[VK API] Уведомление о заявке успешно отправлено в ВК!');
            resolve(true);
          } else {
            console.error('[VK API] Ошибка от ВК:', json.error);
            resolve(false);
          }
        } catch (e) {
          console.error('[VK API] Ошибка обработки ответа от ВК:', e);
          resolve(false);
        }
      });
    }).on('error', (err) => {
      console.error('[VK API] Ошибка сетевого запроса к ВК:', err);
      resolve(false);
    });
  });
}

// API: Handle Lead Form Submission
app.post('/api/contact', async (req, res) => {
  const { name, email, message, project_type, budget } = req.body;

  let extraInfo = '';
  if (project_type && project_type !== 'Не указан' && project_type !== 'Не выбран') {
    extraInfo += `📁 Тип проекта: ${project_type}\n`;
  }
  if (budget && budget !== 'Не указан') {
    extraInfo += `💰 Бюджет: ${budget}\n`;
  }

  const leadText = `🚀 НОВАЯ ЗАЯВКА С САЙТА «СТУДИЯ КОДА»!\n\n` +
    `👤 Имя: ${name || 'Не указано'}\n` +
    `📬 Контакт (Telegram / Телефон): ${email || 'Не указан'}\n` +
    extraInfo +
    `💬 О проекте:\n${message || 'Без описания'}\n\n` +
    `📅 Время: ${new Date().toLocaleString('ru-RU', { timeZone: 'Europe/Moscow' })}`;

  console.log('[НОВАЯ ЗАЯВКА]:\n', leadText);

  await sendVKNotification(leadText);

  res.json({ success: true, message: 'Заявка успешно принята' });
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

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`====================================================`);
    console.log(`[Студия Кода] Сервер успешно запущен на порту ${PORT}`);
    console.log(`[INFO] Секретный адрес входа в панель: http://localhost:${PORT}${ADMIN_ROUTE}`);
    console.log(`[INFO] Пароль администратора по умолчанию: ${ADMIN_PASSWORD}`);
    console.log(`====================================================`);
  });
}

module.exports = app;
