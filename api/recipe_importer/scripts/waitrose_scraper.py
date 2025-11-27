"""
Waitrose Recipe Scraper

Scrapes recipe data from Waitrose recipe pages.
Extracts structured data including:
- Recipe name, servings, description
- Prep/cook/total times (in minutes)
- Ingredients list (with brand names removed)
- Instructions
- Image URL (highest quality 2400w version)
- Cook's tips

Also saves scraped data to a text file in scraped_recipes/ folder.
"""

import requests
from bs4 import BeautifulSoup
import json
import re
from pathlib import Path
from urllib.parse import urlparse
from datetime import datetime
from .ingredient_cleaner import clean_ingredient

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

def parse_ingredients_from_html(soup):
    """
    Parse ingredients from the HTML ingredient list with group support.
    Groups are identified by h3/h4 headings within the ingredients section.
    
    Args:
        soup: BeautifulSoup object of the recipe page
        
    Returns:
        List of dictionaries with 'text' and optional 'group' keys
    """
    ingredients = []
    current_group = ""  # Empty string for ungrouped ingredients
    
    # Find the Ingredients heading
    ingredients_heading = soup.find('h2', string='Ingredients')
    if not ingredients_heading:
        return ingredients
    
    # Find the parent section that contains all ingredients content
    # Look for the next ul, which should be the first ingredients list
    current = ingredients_heading.find_next()
    
    while current:
        # Stop if we hit the Method section
        if current.name == 'h2' and 'method' in current.get_text().lower():
            break
        
        # Check if this is a group heading (h3/h4)
        if current.name in ['h3', 'h4']:
            heading_text = current.get_text(strip=True)
            # Make sure it's not "Cook's tip" or other non-ingredient heading
            if 'cook' not in heading_text.lower():
                current_group = heading_text
                
                # If group is a single word, prepend "For the " and lowercase the word
                words = current_group.split()
                if len(words) == 1:
                    current_group = f"For the {current_group.lower()}"
            
        # Check if this is an ingredients list
        elif current.name == 'ul':
            for li in current.find_all('li', recursive=False):
                # Get raw text
                raw_text = li.get_text(separator=' ', strip=True)
                
                # --- USE SHARED CLEANER ---
                cleaned_text = clean_ingredient(raw_text)
                
                if cleaned_text:
                    ing_dict = {"text": cleaned_text}
                    if current_group:
                        ing_dict["group"] = current_group
                    ingredients.append(ing_dict)
        
        # Move to next element
        current = current.find_next()
    
    return ingredients

def save_recipe_to_file(recipe_data: dict):
    """
    Save scraped recipe data to a text file with group formatting.
    """
    # Extract slug from URL
    parsed_url = urlparse(recipe_data['source_url'])
    path_parts = parsed_url.path.split('/recipe/')
    if len(path_parts) > 1:
        slug = path_parts[1].split('?')[0].rstrip('/')
    else:
        slug = "unknown_recipe"
    
    # Add date prefix (YYYY-MM-DD_)
    date_prefix = datetime.now().strftime("%Y-%m-%d")
    filename = f"{date_prefix}_{slug}.txt"
    
    # Create output directory if it doesn't exist
    output_dir = Path(__file__).parent / "scraped_recipes"
    output_dir.mkdir(parents=True, exist_ok=True)
    
    # Write recipe data to file
    output_file = output_dir / filename
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write(f"Recipe URL: {recipe_data['source_url']}\n")
        f.write("="*50 + "\n\n")
        
        f.write(f"NAME: {recipe_data.get('name')}\n\n")
        f.write(f"SERVINGS: {recipe_data.get('servings')}\n\n")
        f.write(f"PREP TIME: {recipe_data.get('prep_time')} mins\n")
        f.write(f"COOK TIME: {recipe_data.get('cook_time')} mins\n")
        f.write(f"TOTAL TIME: {recipe_data.get('total_time')} mins\n\n")
        f.write(f"IMAGE URL: {recipe_data.get('image_url')}\n\n")
        
        f.write("INGREDIENTS:\n")
        current_group = None
        for ing in recipe_data.get('ingredients', []):
            # Check if this ingredient has a different group than the previous
            ing_group = ing.get('group')
            if ing_group != current_group:
                current_group = ing_group
                if current_group:
                    f.write(f"\n{current_group}:\n")
            f.write(f"{ing['text']}\n")
        f.write("\n")
        
        f.write("INSTRUCTIONS:\n")
        for instruction in recipe_data.get('instructions', []):
            f.write(f"{instruction}\n")
        f.write("\n")
        
        if recipe_data.get('cooks_tip'):
            f.write("COOK'S TIP:\n")
            f.write(f"{recipe_data.get('cooks_tip')}\n")
    
    return output_file

def scrape_waitrose_recipe(url: str) -> dict:
    """
    Scrape a Waitrose recipe page and return structured data.
    Also saves the recipe to a text file.
    
    Args:
        url: Full Waitrose recipe URL
        
    Returns:
        Dictionary with recipe data
        
    Raises:
        Exception: If scraping fails or recipe schema not found
    """
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    }
    
    # Fetch the recipe page
    try:
        response = requests.get(url, timeout=10, headers=headers)
        response.raise_for_status()
    except Exception as e:
        raise Exception(f"Failed to fetch recipe: {str(e)}")
    
    soup = BeautifulSoup(response.content, 'html.parser')
    
    # Find JSON-LD schema data
    json_ld_scripts = soup.find_all('script', type='application/ld+json')
    schema_data = None
    
    for script in json_ld_scripts:
        try:
            data = json.loads(script.string)
            if data.get('@type') == 'Recipe':
                schema_data = data
                break
        except json.JSONDecodeError:
            continue
    
    if not schema_data:
        raise Exception("No recipe schema found on page")
    
    recipe_data = {}
    
    # Extract basic info from JSON-LD schema
    recipe_data['name'] = schema_data.get('name')
    recipe_data['servings'] = schema_data.get('recipeYield')
    recipe_data['description'] = schema_data.get('description', '')
    
    # Parse ISO 8601 duration strings to minutes
    def parse_duration(duration_str):
        """Convert PT20M or PT1H5M to integer minutes"""
        if not duration_str:
            return None
        duration_str = duration_str.replace('PT', '')
        hours = 0
        mins = 0
        if 'H' in duration_str:
            parts = duration_str.split('H')
            hours = int(parts[0])
            duration_str = parts[1] if len(parts) > 1 else ''
        if 'M' in duration_str:
            mins = int(duration_str.replace('M', ''))
        return (hours * 60) + mins if (hours or mins) else None
    
    recipe_data['prep_time'] = parse_duration(schema_data.get('prepTime', ''))
    recipe_data['cook_time'] = parse_duration(schema_data.get('cookTime', ''))
    
    # Calculate total time as sum of prep + cook
    if recipe_data['prep_time'] is not None and recipe_data['cook_time'] is not None:
        recipe_data['total_time'] = recipe_data['prep_time'] + recipe_data['cook_time']
    elif recipe_data['prep_time'] is not None:
        recipe_data['total_time'] = recipe_data['prep_time']
    elif recipe_data['cook_time'] is not None:
        recipe_data['total_time'] = recipe_data['cook_time']
    else:
        recipe_data['total_time'] = None
    
    # Parse ingredients from HTML (now with groups support)
    recipe_data['ingredients'] = parse_ingredients_from_html(soup)
    
    # Parse instructions from JSON - split into individual sentences
    instructions_raw = schema_data.get('recipeInstructions', [])
    recipe_data['instructions'] = []
    for step in instructions_raw:
        text = ''
        if isinstance(step, dict):
            text = step.get('text', '')
        else:
            text = step
        
        # Clean up line breaks and multiple spaces
        text = text.replace('\r\n', ' ').replace('\n', ' ')
        text = re.sub(r'\s+', ' ', text)
        text = text.strip()
        # Remove leading step numbers
        text = re.sub(r'^\d+\.\s*', '', text)
        
        if text:
            # Split into sentences (period followed by space and capital letter)
            # This regex handles most cases while avoiding splits on decimals/abbreviations
            sentences = re.split(r'\.\s+(?=[A-Z])', text)
            
            for sentence in sentences:
                sentence = sentence.strip()
                # Add period back if it was removed by split and doesn't already end with punctuation
                if sentence and not sentence[-1] in '.!?':
                    sentence += '.'
                if sentence:
                    recipe_data['instructions'].append(sentence)    

    # Extract highest quality image URL (2400w version)
    image_wrapper = soup.find('div', class_=lambda x: x and 'imagewrapper' in x)
    if image_wrapper:
        picture_tag = image_wrapper.find('picture')
        if picture_tag:
            source_tags = picture_tag.find_all('source')
            if len(source_tags) >= 2:
                srcset = source_tags[1].get('srcset')
                if srcset:
                    images = srcset.split(',')
                    last_image = images[-1].strip()
                    recipe_data['image_url'] = last_image.split()[0]
    
    # Extract Cook's Tip section
    # Parse individual paragraphs as separate tips for better formatting
    cooks_tip_section = soup.find(
        ['h3', 'h4'], 
        string=re.compile(r"Cook['\u2019]s tip", re.IGNORECASE)
    )
    if cooks_tip_section:
        tip_parts = []
        # Get all content until next heading
        for sibling in cooks_tip_section.find_next_siblings():
            if sibling.name in ['h2', 'h3', 'h4']:
                break
            # Get text from this element
            if sibling.name == 'p':
                text = sibling.get_text(strip=True)
                if text:
                    # Remove any leading "Cook's tip" text (with various apostrophe types)
                    text = re.sub(r"^Cook['\u2019\u0027]s\s+tip\s*", '', text, flags=re.IGNORECASE)
                    text = text.strip()
                    if text:
                        tip_parts.append(text)
        
        # Store as list of individual tips (one per paragraph)
        recipe_data['cooks_tip'] = tip_parts if tip_parts else None
    else:
        recipe_data['cooks_tip'] = None
        
    recipe_data['source_url'] = url
    
    # Save to text file
    save_recipe_to_file(recipe_data)
    
    return recipe_data