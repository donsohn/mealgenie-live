import json

def convert_to_js(json_path, js_path):
    with open(json_path, 'r') as f:
        data = json.load(f)
    
    with open(js_path, 'w') as f:
        f.write("window.RECIPE_DATA = ")
        json.dump(data, f)
        f.write(";")

if __name__ == "__main__":
    convert_to_js('summarized_recipes.json', 'recipes_data.js')
