const chromium = require("@sparticuz/chromium");
const puppeteer = require("puppeteer-core");

module.exports = async (req, res) => {
  try {
    const subject = req.query.s || "accounting";
    const url = `https://www.alevelapi.com/?s=${encodeURIComponent(subject)}`;

    const browser = await puppeteer.launch({
      args: chromium.args,
      executablePath: await chromium.executablePath(),
      headless: chromium.headless,
    });

    const page = await browser.newPage();

    await page.goto(url, { waitUntil: "domcontentloaded" });

    const results = await page.evaluate(() => {
      return Array.from(document.querySelectorAll("li.post-item")).map(el => {
        const titleEl = el.querySelector("h2.entry-title");
        const title = titleEl?.innerText.trim() || null;
        const link = titleEl?.querySelector("a")?.href || null;
        const thumbnail = el.querySelector("img")?.src || null;
        const category = el.querySelector(".bb-cat-links")?.innerText.trim() || null;

        return { title, link, thumbnail, category };
      }).filter(item => item.title && item.link);
    });

    await browser.close();

    res.status(200).json({
      creator: "Chathura Hansaka",
      status: true,
      subject,
      total: results.length,
      results
    });

  } catch (error) {
    res.status(500).json({
      creator: "Chathura Hansaka",
      status: false,
      error: error.message
    });
  }
};
