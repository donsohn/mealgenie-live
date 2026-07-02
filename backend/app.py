import os
import json
from pathlib import Path
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv

# Load env variables from .env if present
load_dotenv()

from google.antigravity import Agent, LocalAgentConfig, ToolContext

app = FastAPI(title="MealGenie Live Agent API", version="1.0.0")

# Enable CORS for the local frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

SESSIONS_DIR = Path(__file__).parent / "sessions"
SESSIONS_DIR.mkdir(exist_ok=True)

# Load recipe database
recipes_path = Path(__file__).parent.parent / "planner" / "summarized_recipes.json"
recipes = []
if recipes_path.exists():
    with open(recipes_path, "r", encoding="utf-8") as f:
        recipes = json.load(f)
    print(f"Loaded {len(recipes)} recipes from database.")
else:
    print("Warning: summarized_recipes.json not found.")

# Global in-memory session states as a backup sync cache
SESSION_STATES = {}

# --- AGENT TOOLS ---

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

def get_user_profile(ctx: ToolContext) -> str:
    """Retrieves the user's family profile, kid age range, allergies, and diet preferences."""
    profile = ctx.get_state("user_profile")
    if not profile:
        profile = SESSION_STATES.setdefault(ctx.conversation_id, {}).get("user_profile", {
            "kid_age_range": "None",
            "allergies": "None",
            "diet": "None"
        })
    return json.dumps(profile)

def update_user_profile(kid_age_range: str, allergies: str, diet: str, ctx: ToolContext) -> str:
    """Updates the user's family settings in the session state.
    
    Args:
        kid_age_range: Age range of kids (e.g. "Toddler", "5-10", "None").
        allergies: Comma-separated list of allergies (e.g. "Nuts", "Dairy").
        diet: Diet type (e.g. "Vegetarian", "Low Sodium", "None").
    """
    profile = {
        "kid_age_range": kid_age_range,
        "allergies": allergies,
        "diet": diet
    }
    ctx.set_state("user_profile", profile)
    SESSION_STATES.setdefault(ctx.conversation_id, {})["user_profile"] = profile
    return "User profile updated successfully in agent state."

def get_weekly_meal_plan(ctx: ToolContext) -> str:
    """Retrieves the current weekly meal plan from context state."""
    plan = ctx.get_state("weekly_meal_plan")
    if not plan:
        plan = SESSION_STATES.setdefault(ctx.conversation_id, {}).get("weekly_meal_plan", [])
    return json.dumps(plan)

def set_weekly_meal_plan(days_plan: str, ctx: ToolContext) -> str:
    """Saves a structured weekly plan.
    
    Args:
        days_plan: A JSON array string where each item has 'day' (e.g. 'Monday') and 'meal' (recipe name).
    """
    try:
        plan = json.loads(days_plan)
        ctx.set_state("weekly_meal_plan", plan)
        SESSION_STATES.setdefault(ctx.conversation_id, {})["weekly_meal_plan"] = plan
        return "Meal plan successfully saved in session state."
    except Exception as e:
        return f"Failed to parse meal plan JSON: {str(e)}"

# --- ENDPOINTS ---

class ChatRequest(BaseModel):
    message: str
    conversation_id: str | None = None
    kid_age_range: str | None = None
    allergies: str | None = None
    diet: str | None = None

class PlanRequest(BaseModel):
    conversation_id: str | None = None
    kid_age_range: str
    allergies: str
    diet: str
    days: int = 7

@app.get("/api/health")
def health():
    return {"status": "ok", "api_key_configured": bool(os.environ.get("GEMINI_API_KEY"))}

@app.post("/api/chat")
async def chat(request: ChatRequest):
    if not os.environ.get("GEMINI_API_KEY"):
        raise HTTPException(status_code=500, detail="GEMINI_API_KEY not configured on server.")
        
    config = LocalAgentConfig(
        save_dir=str(SESSIONS_DIR),
        conversation_id=request.conversation_id,
        tools=[
            search_recipes, 
            get_recipe_details, 
            get_user_profile, 
            update_user_profile, 
            get_weekly_meal_plan, 
            set_weekly_meal_plan
        ],
        system_instructions=(
            "You are MealGenie AI, an intelligent, family-centric culinary agent. "
            "You help users plan meals from their library of 551 recipes, manage leftovers, "
            "and suggest healthy choices for grocery shopping.\n\n"
            "CRITICAL:\n"
            "1. You have tools to search/get recipes, manage profiles, and save plans. Use them proactively.\n"
            "2. When planning meals, take the user's kid age range, allergies, and diet preferences into account.\n"
            "3. If the user asks to add, remove, or modify a meal in their plan, use `set_weekly_meal_plan` to persist the updated plan.\n"
            "4. Always return the meal plan as a valid JSON list of day/meal items when calling `set_weekly_meal_plan`."
        )
    )
    
    try:
        async with Agent(config) as agent:
            conv_id = agent.conversation_id
            session = SESSION_STATES.setdefault(conv_id, {})
            
            # Sync user profile if provided in request
            if request.kid_age_range or request.allergies or request.diet:
                current_profile = session.get("user_profile", {
                    "kid_age_range": "None",
                    "allergies": "None",
                    "diet": "None"
                })
                if request.kid_age_range is not None:
                    current_profile["kid_age_range"] = request.kid_age_range
                if request.allergies is not None:
                    current_profile["allergies"] = request.allergies
                if request.diet is not None:
                    current_profile["diet"] = request.diet
                session["user_profile"] = current_profile
                
            response = await agent.chat(request.message)
            text_response = await response.text()
            
            return {
                "response": text_response,
                "conversation_id": conv_id,
                "weekly_meal_plan": session.get("weekly_meal_plan", []),
                "user_profile": session.get("user_profile", {
                    "kid_age_range": "None",
                    "allergies": "None",
                    "diet": "None"
                })
            }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Agent error: {str(e)}")

@app.post("/api/plan")
async def generate_plan(request: PlanRequest):
    if not os.environ.get("GEMINI_API_KEY"):
        raise HTTPException(status_code=500, detail="GEMINI_API_KEY not configured on server.")
        
    config = LocalAgentConfig(
        save_dir=str(SESSIONS_DIR),
        conversation_id=request.conversation_id,
        tools=[
            search_recipes, 
            get_recipe_details, 
            get_user_profile, 
            update_user_profile, 
            get_weekly_meal_plan, 
            set_weekly_meal_plan
        ],
        system_instructions=(
            "You are MealGenie AI. Your task is to generate a structured weekly meal plan and save it."
        )
    )
    
    try:
        async with Agent(config) as agent:
            conv_id = agent.conversation_id
            session = SESSION_STATES.setdefault(conv_id, {})
            session["user_profile"] = {
                "kid_age_range": request.kid_age_range,
                "allergies": request.allergies,
                "diet": request.diet
            }
            
            prompt = (
                f"Please update my user profile using the tools with kid_age_range='{request.kid_age_range}', "
                f"allergies='{request.allergies}', diet='{request.diet}'. "
                f"Then, search my recipes to select healthy meals that suit this profile, and generate a {request.days}-day meal plan. "
                "Save this meal plan using the set_weekly_meal_plan tool. "
                "Finally, explain the plan and list the recipe names you chose."
            )
            
            response = await agent.chat(prompt)
            text_response = await response.text()
            
            return {
                "response": text_response,
                "conversation_id": conv_id,
                "weekly_meal_plan": session.get("weekly_meal_plan", [])
            }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Agent error: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app:app", host="127.0.0.1", port=8000, reload=True)
