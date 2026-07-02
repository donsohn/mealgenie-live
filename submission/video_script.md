# Video Presentation Script: MealGenie Live Suite
### 3-Minute Showcasing Script for YouTube (Kaggle Submission)

This script guides you through recording your video demonstration. Make sure to run the FastAPI backend (`python backend/app.py`) and serve the frontend files locally with camera/microphone access before recording.

---

## Part 1: Introduction (0:00 - 0:30)

*   **On Screen:** Show the **MealGenie Live Suite Hub** (`index.html`) on a mobile emulator or desktop browser. Move the mouse to hover over the "Planner" and "Assistant" options.
*   **Voiceover (Say this):**
    > *"Hi everyone! This is MealGenie Live, my submission for Kaggle's 5-day AI agents intensive course with Google. MealGenie is a hybrid, family-focused culinary assistant designed to simplify both meal planning at home and grocery shopping in the store. Let's start with the planner."*

---

## Part 2: Personalization & Agentic Planning (0:30 - 1:15)

*   **On Screen:** Click on the **Planner** button. Show the setup screen. Adjust the inputs: change family size to 4, select "School Age (5-12)", and check "Generate lunch leftovers". Click **GENERATE WEEKLY PLAN**.
*   **Action:** The button will say "GENIE IS THINKING..." as it sends a POST request to the Google Antigravity backend agent, then switch to the weekly plan view showing the generated meals.
*   **Voiceover (Say this):**
    > *"Here is the meal planner dashboard. When I input my family profile and click generate, the frontend communicates with our FastAPI backend running the Google Antigravity SDK. The agent searches my library of 551 Paprika recipes, filters out non-kid-friendly meals, and formulates a balanced weekly plan, optimizing dinners so we have lunch leftovers for school boxes."*

---

## Part 3: Live Chat with the Antigravity Agent (1:15 - 2:00)

*   **On Screen:** Click the floating indigo **Message** icon at the bottom right. Expand the AI chat panel. Type: *"I don't feel like eating spaghetti on Tuesday. Can you replace it with Army Base Stew?"* and hit Send.
*   **Action:** Show the agent's text response confirming the replacement, and watch the Tuesday dinner card on the dashboard dynamically switch from Spaghetti to Army Base Stew.
*   **Voiceover (Say this):**
    > *"But the real power lies in the stateful Agent Chat. If I want to make changes, I don't have to fill out forms. I just tell the agent: 'replace Tuesday's spaghetti with Army Base Stew'. The agent uses custom tools to search my library, updates the conversation state, and returns the modified plan. The frontend automatically synchronizes and updates the dashboard in real-time."*

---

## Part 4: The AR Shopping Assistant (2:00 - 2:45)

*   **On Screen:** Click the **SHOPPING LIST** button, then click **START LIVE SHOPPING**. Show the full-screen camera view with scanning lasers. Click the "Soda & Beverages" category pill, and click on the "Maison Perrier" or "Classic Coca-Cola" scanning box.
*   **Action:** The speech recognition hears you say *"which is best?"* (or you can trigger it via search/click). The assistant speaks out loud using text-to-speech, saying that Maison Perrier is the healthier choice, highlighting it in gold.
*   **Voiceover (Say this):**
    > *"Once my plan is set, the list is synced to my phone. I hit start shopping to switch to the AR Assistant. In the store, the app uses my device camera and a client-side classifier to detect items on shelves. When I ask: 'which is best?', it queries the Antigravity Agent backend, compares the nutrition ratings, and uses voice feedback to guide me to the healthiest choice, completely hands-free."*

---

## Part 5: Conclusion & Security (2:45 - 3:00)

*   **On Screen:** Briefly show the python terminal window running the backend server, and the clean `.gitignore` / config file.
*   **Voiceover (Say this):**
    > *"The backend is fully secured with environment-injected API keys, ensuring no sensitive credentials are ever public. That's MealGenie Live — a smart, secure, and cohesive AI agent experience. Thanks for watching!"*
