import express from "express";
import dotenv from "dotenv";
import { fetchProductDetails } from "./details.js";
dotenv.config();
const PORT = process.env.PORT || 4000;
const app = express();
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Welcome to Amazon Scraper API");
});

app.post("/scrape", async (req, res) => {
  const { asins } = req.body;
  if (!Array.isArray(asins) || asins.length === 0) {
    return res
      .status(400)
      .json({ error: "Invalid input. Provide an array of ASINs." });
  }
  try {
    const results = await Promise.all(
      asins.map(async (asin) => {
        return await fetchProductDetails(asin);
      })
    );
    res.json(results);
  } catch (error) {
    res
      .status(500)
      .json({ error: "An error occurred while fetching products." });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
