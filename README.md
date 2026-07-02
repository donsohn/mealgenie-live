# MealGenie Live: Stateful AI Meal Planner & AR Shopping Assistant
### Kaggle 5-Day AI Agents Intensive (Google) Project Submission

MealGenie Live Suite is a unified, mobile-first culinary ecosystem designed to eliminate cognitive fatigue at home (meal planning) and in the store (grocery shopping). The application uses a hybrid architecture combining a local browser-side vision/voice environment with an autonomous, stateful python agent backend powered by the **Google Antigravity SDK** and a custom **Model Context Protocol (MCP) Server**.

---

## 1. Problem & Solution

### The Problem:
For busy families, food planning and grocery shopping are major sources of daily cognitive overload. Families struggle with three disconnected tasks:
1. **Meal Planning:** Compiling a weekly dinner schedule that respects kids' dietary constraints, matches recipes in their library, and minimizes food waste by packing leftovers.
2. **Shopping List Compilation:** Translating plans into portions and grocery categories.
3. **In-Store Shopping:** Walking the grocery aisles trying to make healthy choices (e.g. avoiding high-sodium snacks) while holding bags and children.

### The Solution:
**MealGenie Live** solves this by uniting a **Stateful AI Meal Planner** and a **Hands-Free AR Shopping Assistant** into a single cohesive ecosystem. It runs as a lightweight, mobile-first web app backed by a Python server built on the **Google Antigravity SDK**, allowing users to plan at home and get real-time AI guidance in the store.

---

## 2. Technical Architecture & Hybrid Design

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
        J --> K[MCP Recipe Server]
        J --> L[Local Profile Tools]
    end

    B <-->|HTTP POST /api/chat & /api/plan| G
    C <-->|HTTP POST /api/chat| G
```

### Core Frontend Components:
1. **Interactive Meal Planner:** A scheduling UI that parses the user's personal recipe collection (551 Paprika recipes), tracks portions, accommodates child-friendly filters, and compiles category-grouped shopping lists.
2. **AR Shopping Assistant:** A mobile-first camera application featuring a laser scan animation and interactive hover markers over shelf products. It uses **Web Speech API** for hands-free voice commands (*"which is best?"*) and **TensorFlow.js (MobileNet)** to classify items in real-time.

---

## 3. Core Agentic Concepts Demonstrated

### 🤖 1. Agent / Multi-Agent System (ADK)
The python backend server runs a stateful `Agent` using `google.antigravity` equipped with local tools and system instructions. The agent maintains conversation state across turns using `LocalAgentConfig(save_dir="./sessions", conversation_id=...)`.

### 🔌 2. Model Context Protocol (MCP Server)
The agent integrates an external recipe database via a local **MCP Server** (`backend/mcp_server.py`) running `FastMCP`. When the main agent server starts up, the agent dynamically launches the MCP server process over `Stdio` transport and registers its tools:
*   `search_recipes(query)`: Queries the 551 Paprika recipe library export.
*   `get_recipe_details(recipe_name)`: Retrieves ingredients and directions.

### 🛡️ 3. Security Features (Key Lockdown)
*   **No Stored Keys:** No API keys, client secrets, or passwords are hardcoded in the source code.
*   **Environment Variable Injection:** The agent reads the `GEMINI_API_KEY` from the system environment, which is loaded locally from a Git-ignored `.env` file.
*   **Client-Side Isolation:** shoopers can input secondary keys (e.g. ElevenLabs custom TTS voices) in a client-side settings gear modal. These are saved in their browser's local sandbox (`localStorage`) and never reach our servers.

### 📶 4. Deployability & Local Fallback
*   The frontend is fully optimized for mobile devices and is deployed live on Vercel.
*   If the local Python server is offline, the frontend seamlessly falls back to local algorithms: the planner shuffles recipes locally, and the assistant uses local pre-programmed nutritional comparison heuristics.

---

## 4. Setup & Replication Guide

### Prerequisites:
*   Python 3.10+
*   Node.js (for serving the static frontend, optional)
*   A Gemini API Key (get one at [Google AI Studio](https://aistudio.google.com/app/api-keys))

### Step 1: Clone the Code Repository
```bash
git clone https://github.com/donsohn/mealgenie-live.git
cd mealgenie-live
```

### Step 2: Setup the Python Backend
1. Enter the `backend/` directory:
   ```bash
   cd backend
   ```
2. Create and activate a Python virtual environment:
   ```bash
   python3 -m venv venv
   source venv/bin/activate
   ```
3. Install package dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Copy the environment configuration template:
   ```bash
   cp .env.example .env
   ```
5. Edit the `.env` file to insert your `GEMINI_API_KEY`:
   ```env
   GEMINI_API_KEY=your_actual_gemini_api_key
   ```
6. Start the FastAPI agent server:
   ```bash
   python app.py
   ```
   *The server runs locally on `http://127.0.0.1:8000`.*

### Step 3: Run the Frontend App
1. Serve the root folder using a local web server (to enable camera/microphone permissions in the browser):
   ```bash
   # From the root directory (mealgenie-live/)
   npx serve
   ```
2. Open the displayed local URL in your browser (usually `http://localhost:3000`).
3. Select either **Planner** (home plan) or **Assistant** (in-store AR guide) and interact with the ecosystem!
