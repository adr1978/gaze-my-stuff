from pydantic import BaseModel, Field
from typing import List, Optional

class RecipeSchema(BaseModel):
    """
    Shared schema for Recipe data.
    Used by both the Analysis endpoint (AI output) and the Upload endpoint (Frontend input).
    """
    url: str = Field(..., description="Original source URL.")
    title: str = Field(..., description="The title of the recipe.")
    description: Optional[str] = Field(None, description="The description of the recipe.")
    servings: Optional[int] = Field(None, description="The number of servings (e.g., 6).")
    prep_time: Optional[int] = Field(None, description="The preparation time in minutes.")
    cook_time: Optional[int] = Field(None, description="The cooking time in minutes.")
    ingredients: List[str] = Field(..., description="A list of ingredients, with quantities.")
    instructions: List[str] = Field(..., description="A list of numbered instruction steps.")
    notes: Optional[str] = Field(None, description="Any additional notes or tips.")
    source: Optional[str] = Field(None, description="Which site / chef the recipe should be attributed to")
    
    category: Optional[str] = Field(
        None, 
        description=(
            "The most relevant category. Should be one of: "
            "Bread, Christmas, Drinks, Easter, Fish, Halloween, Ice Cream, "
            "Light Bites, Meat (Poultry), Meat (Red), Puddings, Sandwiches, "
            "Side Dishes, Vegetarian"
        )
    )
    
    imageUrl: Optional[str] = Field(None, description="The image url for the recipe image")