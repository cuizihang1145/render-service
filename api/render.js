export default async function handler(req, res) {
  const userAgent = req.headers['user-agent'] || '';
  const isCrawler = /googlebot|bingbot|baiduspider|yandex|facebookexternalhit|twitterbot|slackbot|discordbot|telegrambot|whatsapp/i.test(userAgent);

  // 不是爬虫 → 重定向到主站
  if (!isCrawler) {
    return res.redirect(301, `https://cuizi.top${req.url}`);
  }

  // 解析文章 ID：从 /article/5 提取 5
  const match = req.url.match(/^\/article\/(\d+)/);
  if (!match) {
    // 不是文章页，直接重定向到主站
    return res.redirect(302, `https://cuizi.top${req.url}`);
  }

  const articleId = parseInt(match[1]);

  try {
    // 1. 从主站获取文章数据
    const response = await fetch('https://cuizi.top/wenzhang.json');
    const data = await response.json();
    const articles = data.announcements || [];

    if (articleId < 0 || articleId >= articles.length) {
      return res.status(404).send('<h1>文章不存在</h1>');
    }

    const article = articles[articleId];
    const title = article.title || '无标题';
    const date = article.date || '';
    const content = article.content || '';

    // 2. 把 Markdown 内容转成纯文本（用于描述）
    const plainText = content
      .replace(/```[\s\S]*?```/g, '')
      .replace(/`([^`]+)`/g, '$1')
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/\*([^*]+)\*/g, '$1')
      .replace(/~~(.*?)~~/g, '$1')
      .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
      .replace(/!\[([^\]]*)\]\([^)]*\)/g, '')
      .replace(/^#{1,6}\s+/gm, '')
      .replace(/^[-\d>]\s+/gm, '')
      .replace(/\s+/g, ' ')
      .trim()
      .substring(0, 200);

    // 3. 返回完整 HTML
    const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} · ks</title>
  <meta name="description" content="${plainText}">
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css">
  <style>
    body {
      font-family: 'Inter', -apple-system, "PingFang SC", "Microsoft YaHei", sans-serif;
      background: #FAFAFE;
      color: #1A1A2E;
      line-height: 1.8;
      padding: 2.8rem 1.8rem;
      max-width: 700px;
      margin: 0 auto;
    }
    body.dark {
      background: #14131F;
      color: #E8E6F0;
    }
    .detail-title {
      font-size: 2rem;
      font-weight: 700;
      margin-bottom: 0.3rem;
      line-height: 1.3;
    }
    .detail-date {
      font-size: 0.85rem;
      color: #8A8AB5;
      display: block;
      margin-bottom: 0.6rem;
    }
    .detail-content {
      font-size: 1rem;
      line-height: 1.9;
      word-break: break-word;
    }
    .detail-content p {
      margin-bottom: 0.8rem;
    }
    .detail-content img {
      max-width: 100%;
      height: auto;
      border-radius: 12px;
      margin: 0.8rem 0;
    }
    .detail-content h1, .detail-content h2, .detail-content h3 {
      font-weight: 700;
      margin: 1.2rem 0 0.6rem 0;
      line-height: 1.3;
    }
    .detail-content code {
      font-family: monospace;
      font-size: 0.9em;
      background: rgba(0, 0, 0, 0.06);
      padding: 0.1rem 0.4rem;
      border-radius: 4px;
      color: #D14C4C;
    }
    .detail-content blockquote {
      border-left: 4px solid #6B5ACF;
      padding-left: 1.2rem;
      margin: 0.8rem 0;
      color: #6A6A92;
      font-style: italic;
    }
    .detail-content hr {
      border: none;
      border-top: 2px solid rgba(0, 0, 0, 0.08);
      margin: 1.5rem 0;
    }
    .theme-toggle {
      position: fixed;
      top: 20px;
      right: 24px;
      z-index: 50;
      background: rgba(255, 255, 255, 0.6);
      backdrop-filter: blur(12px);
      border: 1px solid rgba(255, 255, 255, 0.8);
      border-radius: 60px;
      width: 48px;
      height: 48px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.4rem;
      color: #4F4F78;
      cursor: pointer;
      transition: 0.3s ease;
      box-shadow: 0 6px 20px rgba(80, 60, 160, 0.10);
      user-select: none;
      border: none;
      font-family: 'Inter', sans-serif;
    }
    .theme-toggle:hover {
      transform: scale(1.05) rotate(8deg);
      background: rgba(255, 255, 255, 0.85);
      box-shadow: 0 10px 28px rgba(80, 60, 160, 0.18);
    }
    body.dark .theme-toggle {
      background: rgba(30, 28, 50, 0.7);
      border-color: rgba(255, 255, 255, 0.08);
      color: #D0CAF0;
      box-shadow: 0 6px 20px rgba(0, 0, 0, 0.3);
    }
    body.dark .theme-toggle:hover {
      background: rgba(50, 45, 80, 0.8);
    }
    .back-link {
      display: inline-block;
      margin-top: 2rem;
      color: #6B5ACF;
      text-decoration: none;
      font-weight: 500;
    }
    .back-link:hover {
      text-decoration: underline;
    }
    .bg-glow {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      z-index: -2;
      background: radial-gradient(circle at 30% 30%, #F6F2FF, #FFFFFF);
      transition: background 0.5s ease;
    }
    body.dark .bg-glow {
      background: radial-gradient(circle at 30% 30%, #28253D, #0E0D18);
    }
  </style>
</head>
<body>
  <div class="bg-glow"></div>
  <button class="theme-toggle" onclick="document.body.classList.toggle('dark')">
    <i class="fas fa-moon"></i>
  </button>

  <div class="detail-title">${title}</div>
  <span class="detail-date">${date}</span>
  <hr style="border: none; border-top: 1px solid rgba(0, 0, 0, 0.06); margin-bottom: 1.5rem;">
  <div class="detail-content">${content}</div>
  <a href="https://cuizi.top" class="back-link">← 回到首页</a>
</body>
</html>`;

    res.setHeader('Content-Type', 'text/html');
    res.setHeader('Cache-Control', 's-maxage=86400');
    return res.send(html);

  } catch (error) {
    console.error('获取文章失败:', error);
    return res.redirect(302, `https://cuizi.top${req.url}`);
  }
}
