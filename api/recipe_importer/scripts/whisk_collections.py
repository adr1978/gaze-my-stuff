"""
Samsung Food Collection Mappings

Stores collection IDs and provides automatic categorisation based on recipe titles.
Last updated from Samsung Food API: 2025-10-19
"""

# Collection IDs from Samsung Food
COLLECTIONS = {
    "bread": "1050194936d2837722fa12008d5fb44ab75",
    "christmas": "1050194936d2837778485b70609f98ce63d",
    "drinks": "1050194936d283779fb8a93a6af8cca08bc",
    "easter": "1050194a449398b774e84a165aac125e98b",
    "fish": "1050194936d28377e96b315694423ffc8b4",
    "halloween": "1050194936d28377870945382a2b0aab867",
    "high_protein": "1050194936d28377cbba047c8228bd5225b",
    "ice_cream": "1050194936d28377a7c85d2af9396d368ba",
    "light_bites": "1050194936d2837723684502f3717b0d8c7",
    "lunches": "1050194936d28377640b7e8d25608033239",
    "poultry": "1050194936d28377b348b0bac230e07cb49",
    "red_meat": "1050194936d2837718daa79812bb2a7da5f",
    "puddings": "1050194936d283774219b47ad8c8e7d6825",
    "sandwiches": "1050194936d2837731a803afbd56abe6b72",
    "side_dishes": "1050194936d28377127b93483ee45beec58",
    "system": "1050194936d28377865be95390f9ee5e5c6",
    "vegetarian": "1050194936d283779368814889b4a9ada31",
}

# Keywords to match in recipe titles for automatic categorisation
CATEGORY_KEYWORDS = {
    "bread": ["bread", "flatbread", "naan", "focaccia", "ciabatta", "baguette", "roll", "bun" ,"challah", "sourdough", "pita"],
    "christmas": ["christmas", "festive", "gingerbread", "mince pie", "yule", "advent", "stollen", "panettone"],
    "easter": ["easter", "hot cross", "simnel", "easter egg", "chocolate egg"],
    "halloween": ["halloween", "pumpkin", "spooky", "ghost", "poisoned", "severed", "witch", "zombie", "candy", "mummy", "bat", "scary"],
    "drinks": ["smoothie", "milkshake", "juice", "cocktail", "mocktail", "lemonade"],
    "fish": ["fish", "salmon", "cod", "tuna", "haddock", "prawn", "shrimp", "crab", "lobster", "shellfish", "seafood", "mackerel", "sea bass", "trout", "anchovy", "sardine"],
    "poultry": ["chicken", "turkey", "duck"],
    "red_meat": ["pork", "lamb", "beef", "steak", "bacon", "ham", "chorizo", "meatball"],
    "puddings": ["cake", "biscuit", "tart", "crumble", "pudding", "dessert", "cupcake", 
                 "brownie", "cookie", "cheesecake", "meringue", "mousse", "trifle", "traybake", 
                 "shortbread", "pancake", "waffle", "flan", "doughnut", "donut", "scone", "eclair", "profiterole", 
                 "muffin", "madeliene"],
    "ice_cream": ["ice cream", "gelato", "sorbet", "frozen"],
    "sandwiches": ["sandwich", "burger", "wrap", "panini", "sub", "baguette", "roll"],
    "vegetarian": ["vegetarian", "veggie", "vegan", "tofu"],
}

# Categories that exclude puddings (if recipe is meat/fish/veg, don't also add to puddings)
MAIN_DISH_CATEGORIES = ["fish", "poultry", "red_meat", "vegetarian"]

# ---------------------------------------------------------------------------
def get_collection_id_for_recipe(recipe_name: str) -> list:
    """
    Determine which collection(s) a recipe should belong to based on its name.
    
    Rules:
    - If a recipe matches fish/poultry/red_meat/vegetarian, it won't be added to puddings
    - This prevents savoury dishes with "pie" or "tart" being categorised as desserts
    
    Args:
        recipe_name: The name/title of the recipe
        
    Returns:
        List of collection IDs (empty list if no match found)
    """
    recipe_name_lower = recipe_name.lower()
    collection_ids = []
    matched_categories = []
    
    # First pass: identify all matching categories
    for category, keywords in CATEGORY_KEYWORDS.items():
        for keyword in keywords:
            if keyword in recipe_name_lower:
                matched_categories.append(category)
                break  # Found a match in this category, move to next category
    
    # Second pass: apply exclusion rules
    is_main_dish = any(cat in matched_categories for cat in MAIN_DISH_CATEGORIES)
    
    for category in matched_categories:
        # Skip puddings if this is a main dish (meat/fish/veg)
        if category == "puddings" and is_main_dish:
            continue
        
        # Get the collection ID for this category
        collection_id = COLLECTIONS.get(category)
        if collection_id and collection_id not in collection_ids:
            collection_ids.append(collection_id)
    
    return collection_ids

# ---------------------------------------------------------------------------
def get_collection_names_for_recipe(recipe_name: str) -> list:
    """
    Get human-readable collection names for a recipe (useful for logging).
    
    Args:
        recipe_name: The name/title of the recipe
        
    Returns:
        List of collection names
    """
    recipe_name_lower = recipe_name.lower()
    collection_names = []
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
        if category == "puddings" and is_main_dish:
            continue
        
        collection_names.append(category.replace("_", " ").title())
    
    return collection_names if collection_names else ["No automatic match"]