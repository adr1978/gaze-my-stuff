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
    "Sandwiches": "1050194936d2837731a803afbd56abe6b72",
    "Side Dishes": "1050194936d28377127b93483ee45beec58",
    "Vegetarian": "1050194936d283779368814889b4a9ada31",
    # System/Fallback
    "System": "1050194936d28377865be95390f9ee5e5c6",
}

# Keywords to match in recipe titles for automatic categorisation
CATEGORY_KEYWORDS = {
    "Bread": ["bread", "flatbread", "naan", "focaccia", "ciabatta", "baguette", "roll", "bun", "challah", "sourdough", "pita"],
    "Christmas": ["christmas", "festive", "gingerbread", "mince pie", "yule", "advent", "stollen", "panettone"],
    "Easter": ["easter", "hot cross", "simnel", "easter egg", "chocolate egg"],
    "Halloween": ["halloween", "pumpkin", "spooky", "ghost", "poisoned", "severed", "witch", "zombie", "candy", "mummy", "bat", "scary"],
    "Drinks": ["smoothie", "milkshake", "juice", "cocktail", "mocktail", "lemonade"],
    "Fish": ["fish", "salmon", "cod", "tuna", "haddock", "prawn", "shrimp", "crab", "lobster", "shellfish", "seafood", "mackerel", "sea bass", "trout", "anchovy", "sardine"],
    "Meat (Poultry)": ["chicken", "turkey", "duck"],
    "Meat (Red)": ["pork", "lamb", "beef", "steak", "bacon", "ham", "chorizo", "meatball"],
    "Puddings": ["cake", "biscuit", "tart", "crumble", "pudding", "dessert", "cupcake", 
                 "brownie", "cookie", "cheesecake", "meringue", "mousse", "trifle", "traybake", 
                 "shortbread", "pancake", "waffle", "flan", "doughnut", "donut", "scone", "eclair", "profiterole", 
                 "muffin", "madeliene"],
    "Ice Cream": ["ice cream", "gelato", "sorbet", "frozen"],
    "Sandwiches": ["sandwich", "burger", "wrap", "panini", "sub", "baguette", "roll"],
    "Vegetarian": ["vegetarian", "veggie", "vegan", "tofu"],
}

# Categories that exclude puddings (if recipe is meat/fish/veg, don't also add to puddings)
MAIN_DISH_CATEGORIES = ["Fish", "Meat (Poultry)", "Meat (Red)", "Vegetarian"]

# ---------------------------------------------------------------------------
def get_collection_id_for_recipe(recipe_name: str) -> list:
    """
    Determine which collection(s) a recipe should belong to based on its name.
    """
    recipe_name_lower = recipe_name.lower()
    collection_ids = []
    matched_categories = []
    
    # First pass: identify all matching categories
    for category, keywords in CATEGORY_KEYWORDS.items():
        for keyword in keywords:
            if keyword in recipe_name_lower:
                matched_categories.append(category)
                break 
    
    # Second pass: apply exclusion rules
    is_main_dish = any(cat in matched_categories for cat in MAIN_DISH_CATEGORIES)
    
    for category in matched_categories:
        # Skip puddings if this is a main dish
        if category == "Puddings" and is_main_dish:
            continue
        
        # Direct lookup now works because keys match
        collection_id = COLLECTIONS.get(category)
        if collection_id and collection_id not in collection_ids:
            collection_ids.append(collection_id)
    
    return collection_ids

# ---------------------------------------------------------------------------
def get_collection_names_for_recipe(recipe_name: str) -> list:
    """
    Get human-readable collection names for a recipe.
    """
    recipe_name_lower = recipe_name.lower()
    collection_names = []
    matched_categories = []
    
    for category, keywords in CATEGORY_KEYWORDS.items():
        for keyword in keywords:
            if keyword in recipe_name_lower:
                matched_categories.append(category)
                break
    
    is_main_dish = any(cat in matched_categories for cat in MAIN_DISH_CATEGORIES)
    
    for category in matched_categories:
        if category == "Puddings" and is_main_dish:
            continue
        # No need to Title Case replace underscores anymore, keys are already pretty
        collection_names.append(category)
    
    return collection_names if collection_names else ["No automatic match"]

# ---------------------------------------------------------------------------
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