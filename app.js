const express = require("express");
const axios = require("axios");
const https = require("https");

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const axiosIPv4 = axios.create({
  timeout: 15000,

  httpsAgent: new https.Agent({
    family: 6,
    keepAlive: true
  })
});

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

    // lấy IP đang kết nối thật
    const remoteIp =
      response.request?.socket?.remoteAddress || "unknown";

    const ipVersion =
      response.request?.socket?.remoteFamily || "unknown";

    console.log("CONNECTED IP:", remoteIp);
    console.log("IP VERSION:", ipVersion);

    // add header debug
    res.setHeader("x-proxy-ip", remoteIp);
    res.setHeader("x-ip-version", ipVersion);

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