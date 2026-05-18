const express = require("express");
const axios = require("axios");
const https = require("https");

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const axiosIPv4 = axios.create({
  timeout: 15000,

  // httpsAgent: new https.Agent({
  //   family: 4,
  //   keepAlive: true
  // }),

  // headers: {
  //   "User-Agent":
  //     "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124.0.0.0 Safari/537.36"
  // }
});

// proxy ALL routes
app.use(async (req, res) => {
  try {
    const targetUrl = `https://mydio.vn${req.originalUrl}`;

    console.log("PROXY:", targetUrl);

    const response = await axiosIPv4({
      method: req.method,
      url: targetUrl,

      headers: {
        ...req.headers,
        host: "mydio.vn"
      },

      data: req.body,

      responseType: "stream",

      validateStatus: () => true
    });

    res.status(response.status);

    Object.entries(response.headers).forEach(([key, value]) => {
      if (value !== undefined) {
        res.setHeader(key, value);
      }
    });

    response.data.pipe(res);
  } catch (err) {
    console.error("PROXY ERROR:", err.code || err.message);

    res.status(500).json({
      error: true,
      code: err.code,
      message: err.message
    });
  }
});
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log("IPv4 proxy running at http://localhost:3000");
});