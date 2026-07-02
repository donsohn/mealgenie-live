import json
from pathlib import Path
from mcp.server.fastmcp import FastMCP

# Initialize the FastMCP server named "RecipeServer"
mcp = FastMCP("RecipeServer")

# Load recipe database
recipes_path = Path(__file__).parent.parent / "planner" / "summarized_recipes.json"
recipes = []
if recipes_path.exists():
    with open(recipes_path, "r", encoding="utf-8") as f:
        recipes = json.load(f)
    print(f"MCP Loaded {len(recipes)} recipes.")
else:
    print("MCP Warning: summarized_recipes.json not found.")

@mcp.tool()
def search_recipes(query: str) -> str:
    """Searches the local database of 551 recipes by keyword.
    
    Args:
        query: The search term (e.g. "chicken", "salmon", "pesto", "kid friendly", "low sodium").
    """
    query_lower = query.lower()
    matches = []
    for r in recipes:
        name = r.get("name", "")
        ingredients = r.get("ingredients", "")
        categories = [cat.lower() for cat in r.get("categories", [])]
        
        if (query_lower in name.lower() or 
            query_lower in ingredients.lower() or 
            any(query_lower in cat for cat in categories)):
            matches.append({
                "name": name,
                "categories": r.get("categories", []),
                "servings": r.get("servings", "")
            })
            if len(matches) >= 15:  # Limit results to avoid token overflow
                break
                
    if not matches:
        return "No recipes found matching that query."
    return json.dumps(matches, indent=2)

@mcp.tool()
def get_recipe_details(recipe_name: str) -> str:
    """Retrieves the full details (ingredients and directions) of a specific recipe.
    
    Args:
        recipe_name: The exact name of the recipe.
    """
    for r in recipes:
        if r.get("name", "").lower() == recipe_name.lower():
            return json.dumps({
                "name": r.get("name"),
                "ingredients": r.get("ingredients"),
                "directions": r.get("directions"),
                "categories": r.get("categories"),
                "servings": r.get("servings")
            }, indent=2)
    return f"Recipe '{recipe_name}' not found."

if __name__ == "__main__":
    mcp.run()
