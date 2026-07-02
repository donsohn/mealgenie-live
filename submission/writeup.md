# MealGenie Live Suite: Interactive Food Planner & AR Shopping Assistant
### Kaggle 5-Day AI Agents Intensive (Google) Submission Write-Up

MealGenie Live Suite is a unified, mobile-first culinary ecosystem designed to eliminate cognitive fatigue at home (meal planning) and in the store (groceries shopping). The application uses a hybrid architecture combining a local browser-side vision/voice environment with an autonomous, stateful python agent backend powered by the **Google Antigravity SDK**.

---

## 1. Project Architecture Overview

MealGenie Live is split into two standalone yet synced experiences sharing a unified `localStorage` and communicating with the **Google Antigravity** backend agent:

```mermaid
graph TD
    subgraph Frontend (Browser)
        A[index.html Hub] --> B[planner/ Planner App]
        A --> C[live/ AR Assistant App]
        B <--> D[(Browser LocalStorage)]
        C <--> D
        B --> E[TF.js MobileNet Classifier]
        C --> F[Web Speech Voice Loop]
    end

    subgraph Backend (Python Server)
        G[FastAPI Server] <--> H[Google Antigravity Agent]
        H <--> I[Gemini API]
        H <--> J[Tool Registry]
        J --> K[Search 551 Recipes]
        J --> L[Get Recipe Details]
        J --> M[Sync Session State]
    end

    B <-->|HTTP POST /api/chat & /api/plan| G
    C <-->|HTTP POST /api/chat| G
```

### Core Frontend Components:
1. **Interactive Meal Planner:** A scheduling UI that parses the user's personal recipe collection (551 Paprika recipes), tracks portions, accommodates child-friendly filters, and compiles category-grouped shopping lists.
2. **AR Shopping Assistant:** A mobile-first camera application featuring a laser scan animation and interactive hover markers over shelf products. It uses **Web Speech API** for hands-free voice commands (*"which is best?"*) and **TensorFlow.js (MobileNet)** to classify items in real-time.

---

## 2. Stateful Google Antigravity Agent Backend

The python backend server runs a stateful `Agent` using `google.antigravity` equipped with local tools.

### Configured Agent Tools:
*   `search_recipes(query)`: Performs keyword searches on the dataset of 551 recipes, returning matching names, categories, and portions.
*   `get_recipe_details(recipe_name)`: Returns complete ingredients and cooking directions for a specific meal.
*   `get_user_profile(ctx)`: Retrieves kid ages, allergies, and diet preferences from `ToolContext`.
*   `update_user_profile(kid_age_range, allergies, diet, ctx)`: Updates family profile parameters in `ToolContext`.
*   `set_weekly_meal_plan(days_plan, ctx)`: Saves a structured 7-day meal plan directly in the session state.

### Backend Endpoints:
*   `/api/health`: Validates server connectivity and API key settings.
*   `/api/chat`: Handles chat turns with the main conversational agent. Syncs current user parameters and lets the agent directly edit the active meal plan.
*   `/api/plan`: Generates a custom weekly schedule from the recipe library using Gemini reasoning.

---

## 3. Strict Security & Lock-Down Controls

To submit this project safely to Kaggle and post walkthroughs publicly, we have implemented strict credential safety protocols:
1. **Zero Hardcoded Keys:** Neither the source code nor configuration files contain any API keys, passwords, or client secrets.
2. **Environment Variable Injection:** The Google Antigravity Agent loads the `GEMINI_API_KEY` from the system environment or a local `.env` file.
3. **Explicit `.gitignore` Protection:** A root-level `.gitignore` blocks `.env`, local session cache files (`sessions/`), build directories, and temporary data from being committed. A `.env.example` file is provided as a secure setup template.
4. **Client-Side Key Isolation:** Extra integrations (like ElevenLabs custom voices) are input by the user in a client-side settings gear and stored locally in the browser's `localStorage` — never reaching the server.

---

## 4. Hybrid Offline/Online Fallback

To guarantee robustness, the frontend features a **hybrid fallback mode**:
*   **Online Mode (Connected):** The planner talks to the Antigravity backend to generate meals and chat with the culinary agent. The shopping assistant queries the agent to provide deep comparison reviews on scanned foods.
*   **Offline Mode (Standalone):** If the backend server is unreachable, the apps gracefully degrade. The planner uses a local shuffle-and-filter algorithm to generate plans. The shopping assistant uses client-side MobileNet classifiers and a local product heuristics database.

---

## 5. How to Reproduce

### Backend Setup:
1. Navigate to the `backend/` directory.
2. Create a virtual environment: `python3 -m venv venv && source venv/bin/activate`.
3. Install dependencies: `pip install -r requirements.txt`.
4. Copy environment configuration: `cp .env.example .env` and insert your `GEMINI_API_KEY`.
5. Start the server: `python app.py` (runs on `http://127.0.0.1:8000`).

### Frontend Setup:
1. Open the project root in your browser (use a local server like `npx serve` or equivalent to enable camera permission).
2. Open `index.html` to load the Suite Hub.
