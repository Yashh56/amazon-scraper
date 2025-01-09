# Amazon Product Scraper

A JavaScript-based scraper built with Express.js that extracts product details, reviews, and other information from Amazon using product ASINs. This tool is open-source and designed for educational and research purposes.

## Features

- Scrape product details such as title, price, ratings, and descriptions.
- Extract customer reviews and ratings.
- Fetch product specifications and additional metadata.
- Support for scraping multiple products simultaneously using their ASINs.
- Save scraped data in structured formats (e.g., JSON).

---

## Prerequisites

Before using this scraper, ensure you have the following installed:

- Node.js 14 or higher
- npm (Node package manager)

---

## Installation

1. Clone this repository to your local machine:

   ```bash
   git clone https://github.com/Yashh56/amazon-scraper.git
   ```

2. Navigate to the project directory:

   ```bash
   cd amazon-scraper
   ```

3. Install the required dependencies:

   ```bash
   npm install
   ```

---

## Usage

1. **Setup**

   Ensure you have the ASIN(s) of the Amazon products you wish to scrape. ASINs are unique identifiers for products on Amazon.

2. **Run the scraper**

   Start the Express.js server:

   ```bash
   npm start
   ```

3. **Send a request**

   Use a tool like Postman or `curl` to send a POST request to the server with the ASINs you want to scrape. The request body should be in JSON format:

   ```json
   {
     "asins": ["B0DKXTNZ4G", "B0DGHYDZR9", "B0C1P1YTJ4", "B08DF1Y7T7"]
   }
   ```

   Example `curl` command:

   ```bash
   curl -X POST http://localhost:3000/scrape -H "Content-Type: application/json" -d '{"asins": ["B0DKXTNZ4G", "B0DGHYDZR9"]}'
   ```

4. **Output**

   The server will return a JSON response containing the scraped data for the provided ASINs.

---

## Example Response

```json
{
  "products": [
    {
      "asin": "B0DKXTNZ4G",
      "title": "Sample Product",
      "price": "$19.99",
      "ratings": "4.5",
      "reviews": [
        {
          "author": "John Doe",
          "rating": 5,
          "review": "Excellent product!"
        }
      ]
    }
  ]
}
```

---

## Limitations

- This scraper is for personal and educational use only. Scraping Amazon pages may violate their Terms of Service.
- The scraper may stop working if Amazon updates its page structure.

---

## Contributing

Contributions are welcome! Feel free to submit issues or pull requests.

1. Fork the repository.
2. Create a new branch for your feature or bug fix:

   ```bash
   git checkout -b feature-name
   ```

3. Commit your changes:

   ```bash
   git commit -m "Add new feature"
   ```

4. Push to your branch:

   ```bash
   git push origin feature-name
   ```

5. Submit a pull request.

---

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

---

## Disclaimer

This project is intended for educational and research purposes only. Use it responsibly and ensure compliance with applicable laws and regulations.
