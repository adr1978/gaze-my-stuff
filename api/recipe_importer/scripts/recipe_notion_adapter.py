"""
Recipe specific Notion property and block mapping.
Translates internal Recipe Schema to Notion API structure.
"""
import logging
import time
from itertools import groupby
from datetime import datetime

# Use generic handlers
from notion_handlers.notion_config import DATA_SOURCES
from notion_handlers.notion_loader import create_page_in_data_source
# Import the new image uploader
from notion_handlers.notion_image_uploader import upload_image_from_url

logger = logging.getLogger("recipe_importer")

def build_notion_blocks(recipe_data):
    """
    Constructs the page content (children blocks).
    """
    children = []

    # --- 1. DESCRIPTION ---
    if recipe_data.get('description'):
        children.append({
            "object": "block",
            "type": "heading_2",
            "heading_2": {
                "is_toggleable": True,
                "rich_text": [{"type": "text", "text": {"content": "Description"}}],
                "children": [
                    {
                        "object": "block",
                        "type": "paragraph",
                        "paragraph": {
                            "rich_text": [{"type": "text", "text": {"content": recipe_data['description']}}]
                        }
                    }
                ]
            }
        })

    # --- 2. INGREDIENTS ---
    ingredient_blocks = _build_grouped_list(
        items=recipe_data.get('ingredients', []),
        list_type="bulleted_list_item",
        default_group_title="For the main recipe",
        empty_message="There are no ingredients for this recipe"
    )

    children.append({
        "object": "block",
        "type": "heading_2",
        "heading_2": {
            "is_toggleable": True,
            "rich_text": [{"type": "text", "text": {"content": "Ingredients"}}],
            "children": ingredient_blocks
        }
    })

    # --- 3. STEPS (INSTRUCTIONS) ---
    instruction_blocks = _build_grouped_list(
        items=recipe_data.get('instructions', []),
        list_type="numbered_list_item",
        default_group_title="Main Recipe",
        empty_message="There are no steps for this recipe"
    )

    children.append({
        "object": "block",
        "type": "heading_2",
        "heading_2": {
            "is_toggleable": True,
            "rich_text": [{"type": "text", "text": {"content": "Steps"}}],
            "children": instruction_blocks
        }
    })

    return children


def _build_grouped_list(items, list_type, default_group_title, empty_message):
    """
    Helper to build grouped lists (Ingredients or Instructions).
    """
    if not items:
        return [{
            "object": "block",
            "type": "paragraph",
            "paragraph": {
                "rich_text": [{"type": "text",
                    "text": {"content": empty_message},
                    "annotations": {"color": "gray", "italic": True}
                }]
            }
        }]

    sorted_items = sorted(items, key=lambda x: (x.get('group') if isinstance(x, dict) else x.group) or "")
    
    grouped_data = {}
    for item in sorted_items:
        text = item.get('text') if isinstance(item, dict) else item.text
        group = (item.get('group') if isinstance(item, dict) else item.group) or None
        
        key = group if group else "no_group"
        if key not in grouped_data:
            grouped_data[key] = []
        grouped_data[key].append(text)

    # Single Group
    if len(grouped_data) == 1:
        only_group_items = list(grouped_data.values())[0]
        return [
            {
                "object": "block",
                "type": list_type,
                list_type: {
                    "rich_text": [{"type": "text", "text": {"content": item_text}}]
                }
            }
            for item_text in only_group_items
        ]

    # Multiple Groups
    nested_blocks = []
    
    if "no_group" in grouped_data:
        nested_blocks.append(_create_toggle_block(
            title=default_group_title,
            items=grouped_data["no_group"],
            list_type=list_type
        ))
        del grouped_data["no_group"]
        
    for group_title, group_items in grouped_data.items():
        nested_blocks.append(_create_toggle_block(
            title=group_title,
            items=group_items,
            list_type=list_type
        ))
        
    return nested_blocks


def _create_toggle_block(title, items, list_type):
    return {
        "object": "block",
        "type": "toggle",
        "toggle": {
            "rich_text": [{
                "type": "text",
                "text": {"content": title},
                "annotations": {
                    "color": "blue",
                    "underline": True,
                    "code": True 
                }
            }],
            "children": [
                {
                    "object": "block",
                    "type": list_type,
                    list_type: {
                        "rich_text": [{"type": "text", "text": {"content": item_text}}]
                    }
                }
                for item_text in items
            ]
        }
    }


def save_recipe_to_notion(recipe_data, whisk_id):
    """
    Main entry point to save a recipe to Notion using Data Source ID.
    UPDATED: Uploads image to Notion storage.
    """
    data_source_id = DATA_SOURCES.get("recipes")
    if not data_source_id:
        logger.error("Notion Recipe Data Source ID not configured.")
        return False

    logger.info(f"  -> Preparing Notion payload for: {recipe_data.get('title')}")

    # --- 1. Map Properties ---
    properties = {
        "Recipe Id": {"rich_text": [{"text": {"content": str(whisk_id)}}]},
        "Name": {"title": [{"text": {"content": recipe_data.get('title', 'Untitled')}}]},
        "Date Added (Unix)": {"rich_text": [{"text": {"content": str(int(time.time() * 1000))}}]},
        "Servings": {"number": int(recipe_data.get('servings') or 0)},
        "Total Time": {"number": _calculate_total_time(recipe_data)},
        "Prep Time": {"number": int(recipe_data.get('prep_time') or 0)},
        "Cook Time": {"number": int(recipe_data.get('cook_time') or 0)},
        "Made?": {"checkbox": False}, 
    }

    if recipe_data.get('category'):
        cats = recipe_data['category']
        if isinstance(cats, str):
            cats = [cats]
        properties["Collection"] = {
            "multi_select": [{"name": c} for c in cats if c]
        }
    
    if recipe_data.get('source'):
        properties["Source Title"] = {"rich_text": [{"text": {"content": recipe_data['source']}}]}
        
    if recipe_data.get('url'):
        properties["Source Link"] = {"url": recipe_data['url']}

    # --- 2. Build Content Blocks ---
    children = build_notion_blocks(recipe_data)

    # --- 3. Images (UPDATED) ---
    img_url = recipe_data.get('imageUrl')
    cover_payload = None
    
    if img_url:
        logger.info("  -> Uploading image to Notion storage...")
        file_id = upload_image_from_url(img_url)
        
        if file_id:
            # Construct File Upload Objects
            notion_file_obj = {
                "type": "file_upload",
                "file_upload": {"id": file_id}
            }
            
            # Set Cover
            cover_payload = notion_file_obj
            
            # Set Photos Property
            properties["Photos"] = {
                "files": [{
                    "name": "Recipe Photo",
                    "type": "file_upload",
                    "file_upload": {"id": file_id}
                }]
            }
        else:
            logger.warning("  -> Image upload failed. Skipping image.")

    # --- 4. Create Page ---
    response = create_page_in_data_source(
        data_source_id=data_source_id,
        properties=properties,
        children=children,
        cover=cover_payload
    )
    
    page_id = response.get('id', 'unknown')
    logger.info(f"  -> Notion page created (ID: {page_id})")
    
    return True

def _calculate_total_time(data):
    p = data.get('prep_time') or 0
    c = data.get('cook_time') or 0
    return int(p) + int(c)