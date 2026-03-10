const express = require('express');
const app = express();
const path = require('path');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');
const formParser = require('./formparser');
const deleteOldUploads = require('./cleaner');
const fs = require('fs').promises;
app.disable('x-powered-by');
app.use(cookieParser());

// === Setting up important consts ===
const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0';
const SECRET = process.env.JWT_SECRET;
const IS_PROD = process.env.NODE_ENV === 'production';

// === Security boot features ===
app.set('trust proxy', 1);
// === Middleware ===
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// === Static Files ===
app.use('/static', express.static(path.join(__dirname, 'public')));

// === Rate limit, anti ddos ===
app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200 // max 100 requests per 15 minutes
}));
const loginLimiter = rateLimit({ windowMs: 10 * 60 * 1000, max: 30, standardHeaders: true, legacyHeaders: false });
let header = "";
let footer = "";
// === HTML Comp Routes (Prod) ===
async function bootstrap() {
  [header, footer] = await Promise.all([
    fs.readFile(path.join('public/components/header.html'), "utf-8"),
    fs.readFile(path.join('public/components/footer.html'), "utf-8"),
  ]);

  app.use(formParser);

  app.get('/', async (_, res) => {
    const page = await fs.readFile(path.join("public/index.html"), "utf-8");
    res.type("html").send(page.replace("<!--header-->", header).replace("<!--footer-->", footer));
  });
  app.get('/register', async (_, res) => {
    const page = await fs.readFile(path.join('public/register.html'), "utf-8");
    res.type("html").send(page.replace("<!--header-->", header).replace("<!--footer-->", footer));
  });
  // app.use(crudRouter);
  // app.use(testRouter);
  // === Global error handler ===
  app.use((err, req, res, next) => {
    console.error('Global error handler:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  });
  // === Fallback route ===
  app.use((req, res) => {
    res.status(404).json({ error: 'Not Found' });
  });
  app.listen(PORT, HOST, () => console.log(`:D Server running at http://${HOST}:${PORT}`));
}
bootstrap().catch((err) => {
  console.error("Startup failed :", err);
  process.exit(1);
});
deleteOldUploads();
setInterval(deleteOldUploads, 60 * 60 * 1000);