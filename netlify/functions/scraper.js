const fetch = require("node-fetch");
const cheerio = require("cheerio");

async function scrapePdfLink(url) {
  try {
    const headers = {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
    };

    const res = await fetch(url, { headers });
    const html = await res.text();
    const $ = cheerio.load(html);

    let pdfLink = null;

    $("a").each((_, el) => {
      const text = $(el).text().toLowerCase();
      const href = $(el).attr("href");
      if (!href) return;

      if (
        href.endsWith(".pdf") ||
        text.includes("download") ||
        text.includes("pdf")
      ) {
        pdfLink = href.startsWith("http")
          ? href
          : new URL(href, url).toString();
        return false;
      }
    });

    return pdfLink || null;
  } catch (e) {
    console.error("Error scraping PDF:", e.message);
    return null;
  }
}

async function scrapeAlevelApi(subject) {
  const searchUrl = `https://www.alevelapi.com/?s=${encodeURIComponent(subject)}`;
  const headers = {
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
  };

  try {
    const res = await fetch(searchUrl, { headers });
    const html = await res.text();
    const $ = cheerio.load(html);

    const results = [];

    // more flexible selectors
    $("article").each((_, el) => {
      const titleTag = $(el).find("h2.entry-title a, .entry-title a, .post-title a, h2 a");
      const title = titleTag.text().trim();
      const link = titleTag.attr("href");

      if (title && link) {
        results.push({ title, link });
      }
    });

    // If still empty, try another fallback selector
    if (results.length === 0) {
      $(".entry-title a, .post-title a").each((_, el) => {
        const title = $(el).text().trim();
        const link = $(el).attr("href");
        if (title && link) results.push({ title, link });
      });
    }

    // scrape PDFs in parallel
    const withPdfs = await Promise.all(
      results.map(async (r) => ({
        subject: r.title,
        link: r.link,
        pdf_link: await scrapePdfLink(r.link),
      }))
    );

    return withPdfs;
  } catch (e) {
    console.error("Error fetching:", e.message);
    return [];
  }
}

exports.handler = async (event) => {
  const subject = event.queryStringParameters.s;

  if (!subject) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Missing ?s=subject parameter" }),
    };
  }

  const results = await scrapeAlevelApi(subject);

  return {
    statusCode: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query: subject,
      count: results.length,
      results,
    }),
  };
};
