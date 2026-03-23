require("dotenv").config();
const express = require("express");
const cors = require("cors");
const dns = require("dns");
const { URL } = require("url");

const app = express();

const Url = require("./db.js");

// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());

app.use(express.urlencoded({ extended: false }));
app.use(express.json());

app.use("/public", express.static(`${process.cwd()}/public`));

app.get("/", function (req, res) {
  res.sendFile(process.cwd() + "/views/index.html");
});

// Your first API endpoint
app.get("/api/hello", function (req, res) {
  res.json({ greeting: "hello API" });
});

app.post("/api/shorturl", async (req, res) => {
  const originalUrl = req.body.url;

  const urlRegex = /^https?:\/\/.+/;
  if (!urlRegex.test(originalUrl)) {
    return res.json({ error: "invalid url" });
  }

  let parsedUrl;
  try {
    parsedUrl = new URL(originalUrl);
  } catch {
    return res.json({ error: "invalid url" });
  }

  dns.lookup(parsedUrl.hostname, async (err) => {
    if (err) {
      return res.json({ error: "invalid url" });
    }

    try {
      const count = await Url.countDocuments();
      const shortUrl = count + 1;

      const newUrl = new Url({
        original_url: originalUrl,
        short_url: shortUrl,
      });

      const savedUrl = await newUrl.save();

      res.json({
        original_url: originalUrl,
        short_url: savedUrl.short_url,
      });
    } catch (err) {
      return res.json({ error: "Error saving URL" });
    }
  });
});

app.get("/api/shorturl/:short_url", async (req, res) => {
  const shortUrl = req.params.short_url;

  try {
    const foundUrl = await Url.findOne({ short_url: shortUrl });

    if (!foundUrl) {
      return res.json({ error: "No short URL found" });
    }

    res.redirect(foundUrl.original_url);
  } catch (err) {
    return res.json({ error: "Database error" });
  }
});

app.listen(port, function () {
  console.log(`Listening on port ${port}`);
});
