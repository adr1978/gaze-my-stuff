"""
Waitrose Recipe Scraper
"""

import requests
from bs4 import BeautifulSoup
import json
import re
from pathlib import Path
from urllib.parse import urlparse
from datetime import datetime
from .ingredient_cleaner import clean_ingredient

def parse_ingredients_from_html(soup):
    """
    Parse ingredients from the HTML ingredient list with group support.
    """
    ingredients = []
    current_group = None  # Start with None for ungrouped
    
    ingredients_heading = soup.find('h2', string='Ingredients')
    if not ingredients_heading:
        return ingredients
    
    current = ingredients_heading.find_next()
    
    while current:
        if current.name == 'h2' and 'method' in current.get_text().lower():
            break
        
        if current.name in ['h3', 'h4']:
            heading_text = current.get_text(strip=True)
            if 'cook' not in heading_text.lower():
                current_group = heading_text
                
                # Apply "For the..." logic with Capitalized F
                words = current_group.split()
                if len(words) == 1:
                    # UPDATED: Use title() or manual capitalize to ensure "For the Icing"
                    current_group = f"For the {current_group.title()}"
                else:
                    # If it's something like "for the icing", fix it to "For the icing"
                    if current_group.lower().startswith("for the"):
                        # Keep the rest of the string case as found on site, just uppercase F
                         current_group = "For" + current_group[3:]

        elif current.name == 'ul':
            for li in current.find_all('li', recursive=False):
                raw_text = li.get_text(separator=' ', strip=True)
                cleaned_text = clean_ingredient(raw_text)
                
                if cleaned_text:
                    ing_dict = {"text": cleaned_text, "group": current_group}
                    ingredients.append(ing_dict)
        
        current = current.find_next()
    
    return ingredients

def scrape_waitrose_recipe(url: str) -> dict:
    # ... (Headers and request logic remains the same) ...
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    }
    
    try:
        response = requests.get(url, timeout=10, headers=headers)
        response.raise_for_status()
    except Exception as e:
        raise Exception(f"Failed to fetch recipe: {str(e)}")
    
    soup = BeautifulSoup(response.content, 'html.parser')
    
    # ... (JSON-LD extraction remains the same) ...
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
    
    # ... (Basic info parsing remains the same) ...
    recipe_data['name'] = schema_data.get('name')
    recipe_data['servings'] = schema_data.get('recipeYield')
    recipe_data['description'] = schema_data.get('description', '')
    
    # Duration parsing logic (same as before)
    def parse_duration(duration_str):
        if not duration_str: return None
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
    
    if recipe_data['prep_time'] is not None and recipe_data['cook_time'] is not None:
        recipe_data['total_time'] = recipe_data['prep_time'] + recipe_data['cook_time']
    elif recipe_data['prep_time'] is not None:
        recipe_data['total_time'] = recipe_data['prep_time']
    elif recipe_data['cook_time'] is not None:
        recipe_data['total_time'] = recipe_data['cook_time']
    else:
        recipe_data['total_time'] = None

    # --- INGREDIENTS ---
    recipe_data['ingredients'] = parse_ingredients_from_html(soup)
    
    # --- INSTRUCTIONS ---
    # Parse instructions into objects with group support
    recipe_data['instructions'] = []
    
    # 1. Main Instructions (from JSON-LD usually, assume group=None)
    instructions_raw = schema_data.get('recipeInstructions', [])
    for step in instructions_raw:
        text = ''
        if isinstance(step, dict):
            text = step.get('text', '')
        else:
            text = step
        
        text = text.replace('\r\n', ' ').replace('\n', ' ')
        text = re.sub(r'\s+', ' ', text).strip()
        text = re.sub(r'^\d+\.\s*', '', text)
        
        if text:
            sentences = re.split(r'\.\s+(?=[A-Z])', text)
            for sentence in sentences:
                sentence = sentence.strip()
                if sentence and not sentence[-1] in '.!?':
                    sentence += '.'
                if sentence:
                    # Append as dict
                    recipe_data['instructions'].append({"text": sentence, "group": None})

    # 2. Cook's Tips (Add as instructions with group="Cook's tip")
    cooks_tip_section = soup.find(
        ['h3', 'h4'], 
        string=re.compile(r"Cook['\u2019]s tip", re.IGNORECASE)
    )
    if cooks_tip_section:
        for sibling in cooks_tip_section.find_next_siblings():
            if sibling.name in ['h2', 'h3', 'h4']:
                break
            if sibling.name == 'p':
                text = sibling.get_text(strip=True)
                if text:
                    text = re.sub(r"^Cook['\u2019\u0027]s\s+tip\s*", '', text, flags=re.IGNORECASE)
                    text = text.strip()
                    if text:
                        recipe_data['instructions'].append({"text": text, "group": "Cook's tip"})

    # Extract image (same as before)
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
    
    recipe_data['source_url'] = url
    
    return recipe_data