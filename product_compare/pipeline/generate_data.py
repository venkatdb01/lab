"""
pipeline/generate_data.py

Creates synthetic, reproducible data for the product comparison agent.
Uses only the Python standard library (no pandas needed).

Outputs in data/raw/:
  canonical_models.csv   100 phone models (ground truth - for TESTING only, the agent never reads it)
  products_amazon.csv    100 listings per company, 24 product-detail columns
  products_flipkart.csv
  products_croma.csv
  products_reliance.csv
  reviews_amazon.csv     100 reviews per listing = 10,000 rows per company
  reviews_flipkart.csv
  reviews_croma.csv
  reviews_reliance.csv

Run from the project root:
    python pipeline/generate_data.py

The seed is fixed, so every run produces identical files.
"""

import csv
import random
from datetime import date, timedelta
from pathlib import Path

SEED = 42
LISTINGS_PER_COMPANY = 100
DISTINCT_MODELS_PER_COMPANY = 85   # the other 15 listings are repeat models in another colour
REVIEWS_PER_LISTING = 100
START_DATE = date(2025, 11, 1)     # reviews spread over one year from this date

OUT_DIR = Path(__file__).resolve().parent.parent / "data" / "raw"

# ---------------------------------------------------------------------------
# Companies. Each one has a "personality" so the agent has something to find:
#   neg_bias   - share of negative reviews (Amazon is worst, Croma is best)
#   price_mult - how far above/below the base price this company sells
#   delivery   - range of delivery days
# ---------------------------------------------------------------------------
COMPANIES = [
    {"name": "Amazon",           "slug": "amazon",   "prefix": "AMZ", "price_mult": 1.00, "neg_bias": 0.22, "delivery": (1, 4)},
    {"name": "Flipkart",         "slug": "flipkart", "prefix": "FLP", "price_mult": 0.97, "neg_bias": 0.16, "delivery": (2, 5)},
    {"name": "Croma",            "slug": "croma",    "prefix": "CRM", "price_mult": 1.02, "neg_bias": 0.14, "delivery": (2, 6)},
    {"name": "Reliance Digital", "slug": "reliance", "prefix": "REL", "price_mult": 1.01, "neg_bias": 0.18, "delivery": (3, 7)},
]

# Each company writes product names in its own style. This is WHY matching is hard:
# the same phone looks different on every site.
NAME_TEMPLATES = {
    "Amazon":           "{brand} {model} ({ram}GB RAM, {storage}GB Storage, {colour})",
    "Flipkart":         "{BRAND} {model} {storage} GB ({colour})",
    "Croma":            "{brand} {model} {storage}GB {colour}",
    "Reliance Digital": "{brand} {model} | {ram}GB RAM | {storage}GB | {colour}",
}

# ---------------------------------------------------------------------------
# 10 brands x 10 models = 100 canonical phone models
# ---------------------------------------------------------------------------
MODELS = {
    "Samsung":  ["Galaxy A54 5G", "Galaxy A34 5G", "Galaxy A14 5G", "Galaxy M34 5G", "Galaxy S23 FE",
                 "Galaxy S24", "Galaxy A25 5G", "Galaxy M15 5G", "Galaxy F54 5G", "Galaxy Z Flip5"],
    "Apple":    ["iPhone 15", "iPhone 15 Plus", "iPhone 15 Pro", "iPhone 14", "iPhone 13",
                 "iPhone SE (3rd Gen)", "iPhone 16", "iPhone 16 Pro", "iPhone 16 Plus", "iPhone 14 Plus"],
    "OnePlus":  ["Nord CE 3 Lite 5G", "Nord CE 4 5G", "Nord 3 5G", "Nord 4", "12R",
                 "12", "13R", "11R", "Nord CE 4 Lite 5G", "10R 5G"],
    "Xiaomi":   ["Redmi Note 13 Pro 5G", "Redmi Note 13 5G", "Redmi 13C", "Redmi 13 5G", "Xiaomi 14 CIVI",
                 "Xiaomi 14", "Redmi Note 14 5G", "Poco X6 Pro 5G", "Poco M6 Pro 5G", "Poco F6"],
    "Realme":   ["Narzo 70 Pro 5G", "Narzo 70 5G", "12 Pro+ 5G", "12x 5G", "C63",
                 "13 Pro 5G", "14 Pro 5G", "P1 5G", "GT 6", "Narzo N65 5G"],
    "Motorola": ["Moto G64 5G", "Moto G54 5G", "Moto G34 5G", "Edge 50 Fusion", "Edge 50 Neo",
                 "Edge 50 Pro", "Moto G85 5G", "Moto G45 5G", "Razr 50", "Moto G15"],
    "Google":   ["Pixel 7a", "Pixel 8", "Pixel 8a", "Pixel 9", "Pixel 9 Pro",
                 "Pixel 7", "Pixel 6a", "Pixel 9a", "Pixel 8 Pro", "Pixel 7 Pro"],
    "Vivo":     ["T3 5G", "T3x 5G", "Y28 5G", "Y18", "V30 5G",
                 "V30e 5G", "T3 Pro 5G", "Y200 5G", "X100 Pro", "V40 5G"],
    "Oppo":     ["Reno 11 5G", "Reno 12 5G", "A79 5G", "A59 5G", "F25 Pro 5G",
                 "A3 Pro 5G", "Reno 12 Pro 5G", "Find X7", "A18", "K12 5G"],
    "Honor":    ["X9b 5G", "X7b 5G", "90 5G", "200 Lite 5G", "X8b 5G",
                 "Magic6 Lite", "X6b", "X9a 5G", "200 Pro", "X7c 5G"],
}

PREMIUM_KEYWORDS = ["Pro", "Ultra", "Fold", "Flip", "Find", "S24", "Razr", "Magic"]
APPLE_CHIPS = ["A16 Bionic", "A17 Pro", "A18"]
ANDROID_CHIPS = ["Snapdragon 8 Gen 3", "Snapdragon 7 Gen 3", "Dimensity 7050", "Dimensity 8300",
                 "Exynos 1380", "Tensor G3", "Helio G99", "Snapdragon 6 Gen 1"]
COLOURS = ["Black", "Blue", "Green", "Silver", "White", "Graphite", "Lime", "Gold", "Purple", "Midnight"]

# ---------------------------------------------------------------------------
# Review text building blocks. Each theme has positive and negative sentences.
# The sentiment labelling job (pipeline/label_reviews.py) will later LEARN the
# label from this text - the generator does not write a sentiment column.
# ---------------------------------------------------------------------------
THEMES = {
    "battery": {
        "pos": ["The battery easily gets me through a full day.", "Battery life is excellent even with heavy use."],
        "neg": ["The battery drains within a few hours of normal use.", "Battery life is far below what was advertised."],
    },
    "camera": {
        "pos": ["Photos come out sharp and colourful.", "Night mode in the camera is genuinely impressive."],
        "neg": ["Photos look blurry in anything but daylight.", "The camera struggles badly in low light."],
    },
    "display": {
        "pos": ["The display is bright and smooth.", "Screen quality is great for videos and games."],
        "neg": ["The screen shows colour issues at lower brightness.", "The display scratches far too easily."],
    },
    "delivery": {
        "pos": ["Delivery was quick and the box arrived intact.", "It arrived earlier than the promised date."],
        "neg": ["Delivery was delayed by almost a week.", "The delivery partner gave no tracking updates."],
    },
    "packaging": {
        "pos": ["Packaging was neat and fully sealed.", "It came in proper protective packaging."],
        "neg": ["The phone arrived with a scratched back.", "The box looked already opened when it arrived."],
    },
    "heating": {
        "pos": ["It stays cool even after an hour of gaming.", "No heating issues during normal use."],
        "neg": ["The phone heats up quickly while charging.", "It gets uncomfortably hot during video calls."],
    },
    "software": {
        "pos": ["Software is smooth and updates arrive on time.", "The interface is clean with very little bloatware."],
        "neg": ["Too many pre-installed apps slow it down.", "Software updates keep introducing new bugs."],
    },
    "value": {
        "pos": ["Good value for the price I paid.", "Feels like a bargain compared to similar phones."],
        "neg": ["Overpriced for what you actually get.", "Not worth the money at this price."],
    },
}
OPENERS = {
    "pos":     ["Really happy with this phone.", "Worth buying.", "Solid purchase overall."],
    "neg":     ["Disappointed with this phone.", "Not what I expected.", "Had problems from the start."],
    "neutral": ["It's an average phone.", "Works fine, nothing exceptional."],
}


def build_canonical(rng):
    """One row per real-world phone model. Used as the ground truth for testing matches."""
    rows = []
    idx = 0
    for brand, models in MODELS.items():
        assert len(models) == 10, f"{brand} must have exactly 10 models"
        for model in models:
            idx += 1
            premium = any(k in model for k in PREMIUM_KEYWORDS)
            apple = brand == "Apple"
            base_price = rng.uniform(55000, 140000) if premium else rng.uniform(9000, 45000)
            rows.append({
                "canonical_id": f"C{idx:03d}",
                "brand": brand,
                "model": model,
                "base_price_inr": int(round(base_price, -2)) - 1,
                "ram_gb": rng.choice([8, 12, 16] if premium else [4, 6, 8]),
                "storage_gb": rng.choice([256, 512] if premium else [64, 128]),
                "display_inch": round(rng.uniform(6.1, 6.8), 1),
                "battery_mah": rng.choice([4000, 4500, 5000, 5500, 6000]),
                "processor": rng.choice(APPLE_CHIPS if apple else ANDROID_CHIPS),
                "camera_mp": rng.choice([48, 50, 64, 108, 200]),
                "has_5g": "Yes" if rng.random() < 0.9 else "No",
                "os": "iOS 18" if apple else rng.choice(["Android 14", "Android 15"]),
            })
    return rows


def make_reviews(product_id, company, rng):
    """100 reviews for one listing. Each company's neg_bias controls how many are negative."""
    rows = []
    for k in range(1, REVIEWS_PER_LISTING + 1):
        roll = rng.random()
        if roll < company["neg_bias"]:
            polarity, rating = "neg", rng.choice([1, 2, 2])
        elif roll < company["neg_bias"] + 0.20:
            polarity, rating = "neutral", 3
        else:
            polarity, rating = "pos", rng.choice([4, 5, 5])

        themes = rng.sample(list(THEMES), rng.choice([1, 2]))
        sentences = []
        for theme in themes:
            side = polarity if polarity != "neutral" else rng.choice(["pos", "neg"])
            sentences.append(rng.choice(THEMES[theme][side]))

        rows.append({
            "review_id": f"{product_id}-R{k:03d}",
            "product_id": product_id,
            "company": company["name"],
            "rating": rating,
            "review_text": rng.choice(OPENERS[polarity]) + " " + " ".join(sentences),
            "review_date": (START_DATE + timedelta(days=rng.randint(0, 364))).isoformat(),
            "verified_purchase": "Yes" if rng.random() < 0.8 else "No",
            "helpful_votes": int(rng.expovariate(1 / 3)),
        })
    return rows


def build_company(company, canonical, rng):
    """100 product listings + 100 reviews each for one company."""
    distinct = rng.sample(canonical, DISTINCT_MODELS_PER_COMPANY)
    repeats = rng.sample(distinct, LISTINGS_PER_COMPANY - DISTINCT_MODELS_PER_COMPANY)
    picks = distinct + repeats          # 85 distinct + 15 repeats in a different colour
    rng.shuffle(picks)

    products, reviews = [], []
    for seq, m in enumerate(picks, start=1):
        product_id = f"{company['prefix']}-{seq:04d}"
        brand, model = m["brand"], m["model"]
        colour = rng.choice(COLOURS)

        price = int(round(m["base_price_inr"] * company["price_mult"] * rng.uniform(0.95, 1.05), -2)) - 1
        discount = rng.uniform(0.03, 0.25)
        mrp = int(round(price / (1 - discount), -2)) - 1

        listing_reviews = make_reviews(product_id, company, rng)
        ratings = [r["rating"] for r in listing_reviews]
        reviews.extend(listing_reviews)

        name = NAME_TEMPLATES[company["name"]].format(
            brand=brand, BRAND=brand.upper(), model=model,
            ram=m["ram_gb"], storage=m["storage_gb"], colour=colour,
        )

        products.append({
            "product_id": product_id,
            "company": company["name"],
            "canonical_id": m["canonical_id"],
            "brand": brand,
            "model": model,
            "product_name": name,
            "colour": colour,
            "ram_gb": m["ram_gb"],
            "storage_gb": m["storage_gb"],
            "display_inch": m["display_inch"],
            "battery_mah": m["battery_mah"],
            "processor": m["processor"],
            "camera_mp": m["camera_mp"],
            "has_5g": m["has_5g"],
            "os": m["os"],
            "price_inr": price,
            "mrp_inr": mrp,
            "discount_pct": round((mrp - price) / mrp * 100),
            "avg_rating": round(sum(ratings) / len(ratings), 1),
            "rating_count": len(ratings),
            "seller": rng.choice(["Official Store", "Partner Seller", "Marketplace Seller"]),
            "availability": rng.choices(["In Stock", "Limited Stock", "Out of Stock"], weights=[80, 15, 5])[0],
            "delivery_days": rng.randint(*company["delivery"]),
            "emi_available": "Yes" if price >= 10000 else "No",
            "warranty": "1 Year Manufacturer Warranty",
        })
    return products, reviews


def write_csv(path, rows):
    with open(path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=list(rows[0].keys()))
        writer.writeheader()
        writer.writerows(rows)


def main():
    rng = random.Random(SEED)
    OUT_DIR.mkdir(parents=True, exist_ok=True)

    canonical = build_canonical(rng)
    write_csv(OUT_DIR / "canonical_models.csv", canonical)
    print(f"canonical_models.csv: {len(canonical)} models")

    for company in COMPANIES:
        products, reviews = build_company(company, canonical, rng)
        write_csv(OUT_DIR / f"products_{company['slug']}.csv", products)
        write_csv(OUT_DIR / f"reviews_{company['slug']}.csv", reviews)
        print(f"{company['name']}: {len(products)} products, {len(reviews)} reviews")


if __name__ == "__main__":
    main()
