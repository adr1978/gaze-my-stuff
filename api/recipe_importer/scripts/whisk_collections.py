"""
Samsung Food Collection Mappings
Keys now match the AI/Human Readable categories exactly.
"""

# Collection IDs from Samsung Food
COLLECTIONS = {
    "Bread": "1050194936d2837722fa12008d5fb44ab75",
    "Christmas": "1050194936d2837778485b70609f98ce63d",
    "Drinks": "1050194936d283779fb8a93a6af8cca08bc",
    "Easter": "1050194a449398b774e84a165aac125e98b",
    "Fish": "1050194936d28377e96b315694423ffc8b4",
    "Halloween": "1050194936d28377870945382a2b0aab867",
    "Ice Cream": "1050194936d28377a7c85d2af9396d368ba",
    "Light Bites": "1050194936d2837723684502f3717b0d8c7",
    "Meat (Poultry)": "1050194936d28377b348b0bac230e07cb49",
    "Meat (Red)": "1050194936d2837718daa79812bb2a7da5f",
    "Puddings": "1050194936d283774219b47ad8c8e7d6825",
    "Sandwiches": "1050194936d283770978ec69723151911e5",
    "Side Dishes": "1050194936d28377127b93483ee45beec58",
    "Vegetarian": "1050194936d283779368814889b4a9ada31",
    "Lunches": "1050194936d28377640b7e8d25608033239",
    "High Protein": "1050194936d28377cbba047c8228bd5225b"
}

# Reverse Map: { "Whisk Collection ID": "Notion Category Name" }
# Generated automatically from COLLECTIONS
ID_TO_NAME = {v: k for k, v in COLLECTIONS.items()}

# Keywords for auto-categorization (fallback)
CATEGORY_KEYWORDS = {
    "Bread": ["bread", "loaf", "bun", "sourdough", "baguette", "focaccia", "roll"],
    "Christmas": ["christmas", "festive", "turkey", "mince pie", "pudding", "stuffing"],
    "Drinks": ["drink", "cocktail", "smoothie", "juice", "lemonade", "punch"],
    "Easter": ["easter", "hot cross bun", "lamb", "simnel"],
    "Fish": ["fish", "salmon", "cod", "tuna", "prawn", "shrimp", "crab", "seafood", "haddock", "bass", "trout"],
    "Halloween": ["halloween", "pumpkin", "spooky", "ghost", "spider"],
    "Ice Cream": ["ice cream", "sorbet", "gelato", "frozen yogurt"],
    "Light Bites": ["starter", "snack", "appetizer", "dip", "canape", "soup", "salad"],
    "Meat (Poultry)": ["chicken", "turkey", "duck", "goose", "pheasant"],
    "Meat (Red)": ["beef", "steak", "lamb", "pork", "sausage", "bacon", "ham", "gammon", "venison"],
    "Puddings": ["cake", "cookie", "brownie", "dessert", "pudding", "tart", "pie", "crumble", "mousse", "trifle", "cheesecake"],
    "Sandwiches": ["sandwich", "wrap", "panini", "toastie", "burger", "bagel"],
    "Side Dishes": ["side", "potato", "rice", "vegetable", "slaw", "couscous", "pasta salad"],
    "Vegetarian": ["vegetarian", "tofu", "lentil", "chickpea", "bean", "halloumi", "paneer", "meat free", "plant based"]
}

# Categories that take precedence over "Puddings" if keywords overlap
MAIN_DISH_CATEGORIES = ["Meat (Poultry)", "Meat (Red)", "Fish"]

# ---------------------------------------------------------------------------
# HELPER FUNCTIONS
# ---------------------------------------------------------------------------

def get_collection_names_for_recipe(recipe_name: str) -> list:
    """
    Get human-readable collection names for a recipe based on title keywords.
    """
    if not recipe_name:
        return []
        
    recipe_name_lower = recipe_name.lower()
    collection_names = []
    matched_categories = []
    
    for category, keywords in CATEGORY_KEYWORDS.items():
        for keyword in keywords:
            if keyword in recipe_name_lower:
                matched_categories.append(category)
                break
    
    # Remove Puddings if it conflicts with a main dish category (e.g. "Beef and Ale Pie")
    is_main_dish = any(cat in matched_categories for cat in MAIN_DISH_CATEGORIES)
    
    for category in matched_categories:
        if category == "Puddings" and is_main_dish:
            continue
        collection_names.append(category)
    
    return collection_names if collection_names else ["No automatic match"]

def get_collection_id_from_category(category_name: str) -> str:
    """
    Look up a collection ID from a category name.
    Robust: Handles extra spaces and case sensitivity.
    """
    if not category_name:
        return None
    
    clean_name = category_name.strip()
    
    # 1. Try exact match
    if clean_name in COLLECTIONS:
        return COLLECTIONS[clean_name]
        
    # 2. Try Title Case match (e.g. "christmas" -> "Christmas")
    if clean_name.title() in COLLECTIONS:
        return COLLECTIONS[clean_name.title()]

    return None

def get_collection_id_for_recipe(recipe_name: str) -> list:
    """
    Returns a list of Collection IDs based on title keywords.
    """
    names = get_collection_names_for_recipe(recipe_name)
    ids = []
    for name in names:
        if name in COLLECTIONS:
            ids.append(COLLECTIONS[name])
            
    return ids

def get_collection_name_by_id(collection_id: str) -> str:
    """
    Returns the Category Name for a given Whisk Collection ID.
    Used for reverse mapping (Whisk -> Internal).
    """
    return ID_TO_NAME.get(collection_id)