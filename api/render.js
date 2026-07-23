const puppeteer = require('puppeteer');

// 内存缓存（Vercel 每次冷启动会清空，但同一个实例内能复用）
const cache = new Map();
const CACHE_TTL = 86400; // 24 小时（秒）

export default async function handler(req, res) {
  const userAgent = req.headers['user-agent'] || '';
  const isCrawler = /googlebot|bingbot|baiduspider|yandex|facebookexternalhit|twitterbot|slackbot|discordbot|telegrambot|whatsapp/i.test(userAgent);

  // 不是爬虫 → 直接重定向到你的 SPA 站点
  if (!isCrawler) {
    return res.redirect(301, `https://cuizi.top${req.url}`);
  }

  const cacheKey = req.url || '/';

  // 1. 检查缓存
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL * 1000) {
    // 命中缓存，直接返回
    res.setHeader('Content-Type', 'text/html');
    res.setHeader('X-Cache', 'HIT');
    return res.send(cached.html);
  }

  // 2. 缓存未命中，用 Puppeteer 渲染
  const timeout = 10000;
  let browser;

  try {
    browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu'
      ]
    });

    const page = await browser.newPage();

    // 拦截请求，过滤静态资源（图片、字体、CSS 对爬虫没用）
    await page.setRequestInterception(true);
    page.on('request', (req) => {
      const resourceType = req.resourceType();
      if (['image', 'stylesheet', 'font', 'media'].includes(resourceType)) {
        req.abort();
      } else {
        req.continue();
      }
    });

    // 设置超时
    await page.goto(`https://cuizi.top${req.url}`, {
      waitUntil: 'networkidle0',
      timeout: timeout
    });

    const html = await page.content();

    // 3. 存入缓存
    cache.set(cacheKey, {
      html: html,
      timestamp: Date.now()
    });

    res.setHeader('Content-Type', 'text/html');
    res.setHeader('X-Cache', 'MISS');
    res.setHeader('Cache-Control', 's-maxage=86400, stale-while-revalidate=43200');
    return res.send(html);

  } catch (error) {
    // 渲染失败，返回降级内容
    console.error('渲染失败:', error);
    return res.status(500).send(`
      <!DOCTYPE html>
      <html>
      <head><meta charset="UTF-8"><title>内容加载中</title></head>
      <body>
        <h1>内容加载中</h1>
        <p>请稍后再试，或直接访问 <a href="https://cuizi.top${req.url}">cuizi.top${req.url}</a></p>
      </body>
      </html>
    `);
  } finally {
    if (browser) await browser.close();
  }
      }
