require("dotenv").config();
const express = require("express");
const cors = require("cors");
const dns = require("dns");
const { URL } = require("url");

const app = express();

// Basic Configuration
const port = process.env.PORT || 3000;

let urlDatabase = [];
let counter = 1;

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

app.post("/api/shorturl", (req, res) => {
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

  dns.lookup(parsedUrl.hostname, (err) => {
    if (err) {
      return res.json({ error: "invalid url" });
    }

    const shortUrl = counter++;

    urlDatabase.push({
      shortUrl,
      originalUrl,
    });

    res.json({
      original_url: originalUrl,
      short_url: shortUrl,
    });
  });
});

app.get("/api/shorturl/:short_url", (req, res) => {
  const shortUrl = parseInt(req.params.short_url);

  const entry = urlDatabase.find((u) => u.shortUrl === shortUrl);

  if (!entry) {
    return res.json({ error: "No short URL found" });
  }

  res.redirect(entry.originalUrl);
});

app.listen(port, function () {
  console.log(`Listening on port ${port}`);
});
