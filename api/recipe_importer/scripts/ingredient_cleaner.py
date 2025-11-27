"""
Ingredient Cleaner Utility

Shared logic for cleaning recipe ingredients.
Removes brand names, standardizes spacing, and fixes unit formatting.
Used by both the Waitrose Scraper and the AI Analyser.
"""

import re

# Brand terms to strip from ingredients
TERMS_TO_REMOVE = [
    "Essential Waitrose",
    "Duchy Organic",
    "Free Range",
    "Waitrose & Partners",
    "No.1",
    "Cooks' Ingredients",
    "British",
    "half fat",
    "reduced fat",
    "low fat",
    "fat free",
    "Mutti Polpa",
    "De Cecco",
    "Billington's",
    "Nielsen-Massey",
    "5% fat",
    "Bart",
    "The Levantine Table",
    "Allinson’s",
    "Blacktail",
    "Essential",
    "Deep South",
    "Kallo",
    "Clearspring"
]

def clean_ingredient(text: str) -> str:
    """
    Cleans an ingredient string by removing brand names and fixing formatting.
    """
    if not text:
        return ""

    ingredient = text.strip()

    # Remove brand terms using flexible regex matching
    for brand in TERMS_TO_REMOVE:
        brand_pattern = re.escape(brand)
        # Handle different apostrophe types
        brand_pattern = brand_pattern.replace(r"\'", r"['\u2019\u0027]")
        brand_pattern = brand_pattern.replace(r"'", r"['\u2019\u0027]")
        # Handle variable whitespace
        brand_pattern = brand_pattern.replace(r'\ ', r'\s+')
        brand_pattern = brand_pattern + r'\s*'
        
        ingredient = re.sub(brand_pattern, '', ingredient, flags=re.IGNORECASE)

    # Ensure space after measurement units (e.g., "100g" -> "100 g")
    # Matches numbers (including decimals and fractions) followed immediately by a unit
    ingredient = re.sub(
        r'(\d+(?:\.\d+|¼|½|¾)?)(kg|g|ml|l|tbsp|tsp|pack|tub|bulb/s|clove/s|can/s|cans)', 
        r'\1 \2 ', 
        ingredient
    )

    # Collapse multiple spaces into single space
    ingredient = re.sub(r'\s+', ' ', ingredient)
    
    return ingredient.strip()