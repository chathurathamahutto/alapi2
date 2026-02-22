const axios = require("axios");
const cheerio = require("cheerio");

module.exports = async (req, res) => {
  try {
    // Query param eke subject ganna, default = accounting
    const subject = req.query.s || "accounting";

    // Target URL
    const url = `https://www.alevelapi.com/?s=${encodeURIComponent(subject)}`;

    const { data } = await axios.get(url, {
      headers: { "User-Agent": "Mozilla/5.0" }
    });

    const $ = cheerio.load(data);
    const results = [];

    $("li.post-item").each((i, el) => {
      const title = $(el).find("h2.entry-title").text().trim();
      const link = $(el).find("h2.entry-title a").attr("href");
      const thumbnail = $(el).find("img").attr("src") || null;
      const category = $(el).find(".bb-cat-links").text().trim() || null;

      if (title && link) {
        results.push({ title, link, thumbnail, category });
      }
    });

    res.status(200).json({
      creator: "Chathura Hansaka",
      status: true,
      subject,
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
