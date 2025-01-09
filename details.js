import axios from "axios";
import * as cheerio from "cheerio";

export const fetchProductDetails = async (asin) => {
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
    const globalRatings = reviewMatch ? reviewMatch[1].replace(/,/g, "") : "0";
    const sellerInfoElement = $("#sellerProfileTriggerId").attr("href");
    let sellerId = "Seller ID not found";
    if (sellerInfoElement) {
      const sellerMatch = sellerInfoElement.match(/seller=([A-Z0-9]+)/);
      if (sellerMatch && sellerMatch[1]) {
        sellerId = sellerMatch[1];
      }
    }
    const sellerData = await scrapeSellerInfo(sellerId);
    const videos = [];
    $("#videoBlockContainer video").each((_, el) => {
      const videoSrc = $(el).attr("src");
      if (videoSrc) videos.push(videoSrc);
    });
    const productDetails = {};
    $("#productDetails_techSpec_section_1 tr").each((_, row) => {
      const key = $(row).find("th").text().trim();
      const value = $(row).find("td").text().trim();
      if (key && value) productDetails[key] = value;
    });
    const additionalDetails = {};
    $("#productDetails_detailBullets_sections1 tr").each((_, row) => {
      const key = $(row).find("th").text().trim();
      const value = $(row).find("td").text().trim();
      if (key && value) additionalDetails[key] = value;
    });
    const techSpecs = {};
    $(".content-grid-block table.a-bordered tbody tr").each((_, row) => {
      const key = $(row).find("td").first().text().trim();
      const value = $(row).find("td").last().text().trim();
      if (key && value) techSpecs[key] = value;
    });
    const brand = $("#bylineInfo").text().trim() || "Brand not found";
    const category = $(".a-breadcrumb span.a-list-item").last().text().trim();
    const colorOptions = [];
    $("#variation_color_name li").each((_, el) => {
      const colorName = $(el).text().trim();
      if (colorName) {
        colorOptions.push(colorName);
      }
    });
    $("#variation_color_name img").each((_, el) => {
      const colorAlt = $(el).attr("alt");
      if (colorAlt) {
        colorOptions.push(colorAlt);
      }
    });
    let warranty = "";
    const warrantySelectors = [
      "#warranty-and-support-app",
      "#productDetails_warranty_support_sections",
      "tr:contains('Warranty') td",
      "#feature-bullets li:contains('Warranty')",
      "#productDetails_techSpec_section_1 tr:contains('Warranty') td",
    ];
    for (const selector of warrantySelectors) {
      const warrantyText = $(selector).text().trim();
      if (warrantyText) {
        warranty = warrantyText;
        break;
      }
    }
    let availability = "";
    const availabilitySelectors = [
      "#availability span",
      "#deliveryMessageMirId",
      "#outOfStock",
      ".a-size-medium.a-color-success",
      ".a-size-medium.a-color-price",
    ];
    for (const selector of availabilitySelectors) {
      const availText = $(selector).text().trim();
      if (availText) {
        availability = availText;
        break;
      }
    }
    const isFreeDelivery = $("span:contains('FREE Delivery')").length > 0;
    const isPrimeDelivery = $("#prime_feature_div").length > 0;
    return {
      title: title || "Title not found",
      discounted_price: discountedPrice || "Discounted price not found",
      original_price: originalPrice || "Original price not found",
      about_product:
        aboutProduct.length > 0
          ? aboutProduct
          : ["About this item section not found"],
      product_details: Object.keys(productDetails).length
        ? productDetails
        : techSpecs,
      additional_details: Object.keys(additionalDetails).length
        ? additionalDetails
        : techSpecs,
      images: images.length > 0 ? images : ["No images found"],
      star_rating: starRating,
      videos: videos.length > 0 ? videos : ["No videos found"],
      availability: availability || "Availability not found",
      isFreeDelivery: isFreeDelivery,
      isPrimeDelivery: isPrimeDelivery,
      brand: brand,
      category: category,
      warranty: warranty,
      color_options:
        colorOptions.length > 0 ? colorOptions : ["No color options found"],
      seller_id: sellerId,
      seller_info: sellerData,
      global_ratings: globalRatings,
      reviews: await fetchReviews(asin),
    };
  } catch (error) {
    console.error(`Error fetching details for ASIN ${asin}:`, error.message);
    return {
      error: `Failed to fetch details for ASIN ${asin}: ${error.message}`,
    };
  }
};

export const scrapeSellerInfo = async (sellerId) => {
  const url = `https://www.amazon.in/sp?seller=${sellerId}`;
  try {
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
    const sellerName =
      $("#seller-name").text().trim() || "Seller name not found";
    const relativeStoreLink = $('a.a-link-normal[href*="/storefront"]').attr(
      "href"
    );
    const storeLink = relativeStoreLink
      ? `https://www.amazon.in${relativeStoreLink}`
      : "Storefront link not found";
    const rating =
      $("i.a-icon.a-icon-star .a-icon-alt").first().text().trim() ||
      "Rating not found";
    const aboutSeller =
      $(".spp-expander-more-content").text().trim() ||
      "About Seller information not found";
    return {
      sellerName,
      storeLink,
      rating,
      aboutSeller,
    };
  } catch (error) {
    console.error("Error fetching seller page:", error.message);
    return {
      error: "Failed to fetch seller information",
    };
  }
};

export const fetchReviews = async (asin) => {
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
    const reviews = [];
    $("[data-hook='review']").each((_, element) => {
      const review = {
        id: $(element).attr("id"),
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
    return reviews;
  } catch (error) {
    console.log(`Error fetching reviews for ASIN ${asin}:`, error.message);
  }
};
