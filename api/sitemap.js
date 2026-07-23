export default async function handler(req, res) {
  try {
    const response = await fetch('https://cuizi.top/wenzhang.json');
    const data = await response.json();
    const articles = data.announcements || [];
    const today = new Date().toISOString().split('T')[0];

    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://bot.cuizi.top/</loc>
    <lastmod>${today}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>`;

    articles.forEach((article, index) => {
      const date = article.date || today;
      xml += `
  <url>
    <loc>https://bot.cuizi.top/article/${index}</loc>
    <lastmod>${date}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>`;
    });

    xml += `
</urlset>`;

    res.setHeader('Content-Type', 'application/xml');
    res.setHeader('Cache-Control', 's-maxage=86400');
    return res.send(xml);

  } catch (error) {
    const today = new Date().toISOString().split('T')[0];
    return res.send(`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://bot.cuizi.top/</loc>
    <lastmod>${today}</lastmod>
  </url>
</urlset>`);
  }
}
