# MealGenie Live: Stateful AI Meal Planner & AR Shopping Assistant
## Subtitle: A Hybrid Local-Cloud Ecosystem Powered by the Google Antigravity SDK

* **Course/Intensive:** Kaggle's 5-Day AI Agents Intensive (Google)
* **Recommended Submission Track:** Personal Assistants / Daily Productivity
* **Public Project Demo Link:** [https://mealgenie-live.vercel.app/](https://mealgenie-live.vercel.app/)
* **Code Repository Link:** [https://github.com/donsohn/mealgenie-live.git](https://github.com/donsohn/mealgenie-live.git)

---

## 1. Project Vision & Problem Statement

For busy families, food planning and grocery shopping are major sources of daily cognitive overload. Families struggle with three disconnected tasks:
1. **Meal Planning:** Compiling a weekly dinner schedule that respects kids' dietary constraints, matches recipes in their library, and minimizes food waste by packing leftovers.
2. **Shopping List Compilation:** Translating plans into portions and grocery categories.
3. **In-Store Shopping:** Walking the grocery aisles trying to make healthy choices (e.g. avoiding high-sodium snacks) while holding bags and children.

**MealGenie Live** solves this by uniting a **Stateful AI Meal Planner** and a **Hands-Free AR Shopping Assistant** into a single cohesive ecosystem. It runs as a lightweight, mobile-first web app backed by a Python server built on the **Google Antigravity SDK**, allowing users to plan at home and get real-time AI guidance in the store.

---

## 2. System Architecture

MealGenie Live utilizes a **Hybrid Local-Cloud Architecture** that combines low-latency browser features (vision and speech) with stateful cloud-based LLM reasoning:

```mermaid
graph TD
    subgraph Frontend (Client Browser)
        A[Suite Hub index.html] --> B[Planner planner/index.html]
        A --> C[Assistant live/index.html]
        B <--> D[(Browser LocalStorage)]
        C <--> D
        B --> E[TF.js MobileNet Classifier]
        C --> F[Web Speech Voice Command Loop]
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

---

## 3. Core Agentic Behaviors & SDK Integration

The backend is built using the **Google Antigravity SDK** (`google.antigravity`), running a stateful `Agent` configured with custom Python tools that interface with a personal library of **551 Paprika recipes**.

### The Tool Registry:
*   `search_recipes(query)`: Uses token matching to search the library for ingredients, categories, or keywords.
*   `get_recipe_details(recipe_name)`: Fetches full details (prep time, ingredients, directions) for cooking.
*   `get_user_profile(ctx)` & `update_user_profile(...)`: Persists and retrieves the user's family parameters (e.g., school-age children, low-sodium constraints) using the agent's `ToolContext`.
*   `set_weekly_meal_plan(days_plan, ctx)`: Saves the structured 7-day plan directly into the persistent conversation trajectory.

### Two-Way Plan Synchronization:
When a user chats with the agent (*"Can you change Wednesday's dinner to a low-sodium chicken meal?"*), the agent uses `search_recipes` to find matching options, calls `set_weekly_meal_plan` to rewrite the schedule, and returns its response. The frontend parses this state and instantly updates the interactive calendar cards in the dashboard.

---

## 4. In-Store AR & Voice Interaction

Once in the grocery store, the shopping assistant provides a hands-free, heads-up comparison tool:
*   **Real-time AI Vision:** Points the camera at products to classify items using **TensorFlow.js (MobileNet)** in the browser, matching them to active categories.
*   **Speech Commands:** Listens for verbal triggers (*"Which is best?"*, *"Recommend one"*) using the **Web Speech API**.
*   **Voice Reasoning:** Sends the options to the Antigravity Agent backend, which reasons over the family's profile (e.g., highlighting low sodium for kids), highlights the best product with a gold marker on screen, and explains the choice out loud.

---

## 5. Safe & Secure Deployment Controls

In compliance with hackathon submission safety guidelines, the project contains **no hardcoded credentials or API keys**:
1. **API Key Injection:** The Python backend references `GEMINI_API_KEY` from environment variables, copying them from a local, Git-ignored `.env` file.
2. **Explicit `.gitignore` Protection:** Blocks deployment cache files (`.vercel/`), python virtual environments (`venv/`), compile files, and local session databases from version control.
3. **Local Storage Privacy:** Shoppers can save secondary keys (e.g., ElevenLabs custom TTS voices) inside a client settings modal. These are saved exclusively in their browser's local sandbox (`localStorage`) and never transmitted to our servers.

---

## 6. Setup & Execution Guide

### Local Backend Server Setup:
1. Clone the repository and enter the suite:
   ```bash
   git clone https://github.com/donsohn/mealgenie-live.git
   cd mealgenie-live
   ```
2. Set up a virtual environment and install dependencies:
   ```bash
   python3 -m venv venv
   source venv/bin/activate
   pip install -r backend/requirements.txt
   ```
3. Copy the template configuration and fill in your Gemini API Key:
   ```bash
   cp backend/.env.example backend/.env
   # Open backend/.env and replace 'your_gemini_api_key_here' with your real API key
   ```
4. Start the backend:
   ```bash
   python backend/app.py
   ```
   *The server runs locally on `http://127.0.0.1:8000`.*

### Frontend Server Setup:
1. Serve the root directory using any local web server (e.g., `npx serve` or python's `http.server`) to ensure camera and microphone browser permissions work locally:
   ```bash
   npx serve
   ```
2. Open the URL in your browser and experience the MealGenie Live Suite!
