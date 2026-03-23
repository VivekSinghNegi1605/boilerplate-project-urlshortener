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

    const existing = urlDatabase.find((u) => u.original_url === originalUrl);
    if (existing) {
      return res.json(existing);
    }

    const shortUrl = counter++;

    const newEntry = {
      original_url: originalUrl,
      short_url: shortUrl,
    };

    urlDatabase.push(newEntry);

    res.json(newEntry);
  });
});

app.get("/api/shorturl/:short_url", (req, res) => {
  const shortUrl = Number(req.params.short_url);

  const entry = urlDatabase.find((u) => u.short_url === shortUrl);

  if (!entry) {
    return res.json({ error: "No short URL found" });
  }

  res.writeHead(302, {
    Location: entry.original_url,
  });
  res.end();
});

app.listen(port, function () {
  console.log(`Listening on port ${port}`);
});
