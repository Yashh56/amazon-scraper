import express from "express";
import dotenv from "dotenv";
import { fetchProductDetails } from "./details.js";
dotenv.config();
const app = express();
const PORT = process.env.PORT || 4000;

app.use(express.json());

app.get("/", (req, res) => {
  res.send("Welcome to Amazon Product Details API!");
});

app.post("/scrape", async (req, res) => {
  const { asins } = req.body;
  if (!Array.isArray(asins) || asins.length === 0) {
    return res
      .status(400)
      .json({ error: "Invalid input. Provide an array of ASINs." });
  }
  const results = [];
  for (const asin of asins) {
    const details = await fetchProductDetails(asin);
    results.push({ ASIN: asin, ...details });
  }

  res.json(results);
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
