import axios from "axios";
import * as cheerio from "cheerio";

export async function fetchProductDetails(asin) {
  try {
    const url = "https://www.amazon.in/dp/" + asin;
    const response = await axios.get(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
        "Accept-Encoding": "gzip, deflate, br",
        Connection: "keep-alive",
        "Cache-Control": "no-cache",
      },
    });

    const $ = cheerio.load(response.data);

    const discountedPrice = $(".a-price .a-price-whole")
      .first()
      .text()
      .replace(/[^0-9]/g, "");

    const originalPrice = $(".a-price.a-text-price .a-offscreen")
      .first()
      .text()
      .replace(/[^0-9]/g, "");

    const title =
      $("#productTitle").text().trim() ||
      $(".product-title-word-break").text().trim();

    const aboutProduct = $("#feature-bullets ul li")
      .map((_, el) => $(el).text().trim())
      .get()
      .filter((text) => text !== "");

    const images = [];
    $("#altImages img").each((_, el) => {
      const src = $(el).attr("src");
      if (src && !src.includes("sprite")) {
        const highResSrc = src.replace(/\._[^\.]*_\./, ".");
        images.push(highResSrc);
      }
    });

    const mainImage =
      $("#landingImage").attr("src") || $("#imgBlkFront").attr("src");
    if (mainImage) images.unshift(mainImage);

    const starText = $("#averageCustomerReviews .a-icon-alt").first().text();
    const starMatch = starText.match(/(\d+(\.\d+)?)/);
    const starRating = starMatch ? starMatch[1] : "Not available";

    const reviewCountText = $("#acrCustomerReviewText").first().text();
    const reviewMatch = reviewCountText.match(/(\d+(\,\d+)*)/);
    const reviewCount = reviewMatch ? reviewMatch[1].replace(/,/g, "") : "0";

    const reviews = [];
    $("[data-hook='review']").each((_, element) => {
      const review = {
        title: $(element).find("[data-hook='review-title']").text().trim(),
        rating: $(element)
          .find("[data-hook='review-star-rating']")
          .text()
          .trim(),
        date: $(element).find("[data-hook='review-date']").text().trim(),
        body: $(element).find("[data-hook='review-body']").text().trim(),
        verified: $(element).find(".avp-badge").length > 0,
      };
      if (review.title || review.body) {
        reviews.push(review);
      }
    });

    return {
      discounted_price: discountedPrice || "Discounted price not found",
      original_price: originalPrice || "Original price not found",
      title: title || "Title not found",
      about_product:
        aboutProduct.length > 0
          ? aboutProduct
          : ["About this item section not found"],
      images: images.length > 0 ? images : ["No images found"],
      star_rating: starRating,
      review_count: reviewCount,
      reviews: reviews.length > 0 ? reviews : ["No reviews found"],
    };
  } catch (error) {
    console.error(`Error fetching details for ASIN ${asin}:`, error.message);
    return {
      discounted_price: "Error",
      original_price: "Error",
      title: "Error",
      about_product: ["Error"],
      images: ["Error"],
      star_rating: "Error",
      review_count: "Error",
      reviews: ["Error"],
    };
  }
}
