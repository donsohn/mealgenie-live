import zipfile
import gzip
import json
import os

def parse_paprika_export(zip_path, output_path):
    recipes = []
    
    with zipfile.ZipFile(zip_path, 'r') as z:
        # Get all .paprikarecipe files
        recipe_files = [f for f in z.namelist() if f.endswith('.paprikarecipe')]
        
        print(f"Found {len(recipe_files)} recipes.")
        
        for recipe_file in recipe_files:
            try:
                # Read the gzipped content
                with z.open(recipe_file) as f:
                    content = gzip.decompress(f.read())
                    recipe_data = json.loads(content.decode('utf-8'))
                    
                    # Extract only what we need for the agent
                    summary = {
                        "name": recipe_data.get("name"),
                        "ingredients": recipe_data.get("ingredients"),
                        "directions": recipe_data.get("directions"),
                        "categories": recipe_data.get("categories", []),
                        "rating": recipe_data.get("rating", 0),
                        "prep_time": recipe_data.get("prep_time"),
                        "servings": recipe_data.get("servings")
                    }
                    recipes.append(summary)
            except Exception as e:
                print(f"Error parsing {recipe_file}: {e}")

    # Save the summarized data
    with open(output_path, 'w') as f:
        json.dump(recipes, f, indent=2)
    
    print(f"Successfully summarized {len(recipes)} recipes to {output_path}")

if __name__ == "__main__":
    ZIP_PATH = "/Users/donsohn/.gemini/antigravity/scratch/meal-mind/recipes.zip"
    OUTPUT_PATH = "/Users/donsohn/.gemini/antigravity/scratch/meal-mind/summarized_recipes.json"
    parse_paprika_export(ZIP_PATH, OUTPUT_PATH)
