/**
 * MealMind - Intelligent Planner Logic
 */

class MealMind {
    constructor() {
        this.recipes = [];
        this.currentPlan = [];
        this.profile = {};
        
        // UI Elements
        this.setupView = document.getElementById('setup-view');
        this.dashboardView = document.getElementById('dashboard-view');
        this.shoppingView = document.getElementById('shopping-view');
        this.mealGrid = document.getElementById('meal-grid');
        this.generateBtn = document.getElementById('generate-btn');
        
        this.init();
    }

    async init() {
        if (window.RECIPE_DATA) {
            this.recipes = window.RECIPE_DATA;
            console.log(`Pre-loaded ${this.recipes.length} recipes.`);
        } else {
            try {
                const response = await fetch('summarized_recipes.json');
                this.recipes = await response.json();
                console.log(`Fetched ${this.recipes.length} recipes.`);
            } catch (err) {
                console.error("Failed to load recipes:", err);
                // Fallback mock data
                this.recipes = [
                    { name: "Garlic Chili Oil Noodles", categories: ["Asian"], ingredients: "Noodles, Garlic, Chili Oil, Soy Sauce" },
                    { name: "Pesto Stuffed Salmon", categories: ["Seafood"], ingredients: "Salmon, Pesto, Spinach" },
                    { name: "Roasted Chicken & Roots", categories: ["Main"], ingredients: "Chicken, Carrots, Potatoes" },
                    { name: "Zucchini Fritters", categories: ["Vegetarian"], ingredients: "Zucchini, Flour, Egg, Scallions" },
                    { name: "Korean Beef Bowl", categories: ["Korean"], ingredients: "Beef, Rice, Soy Sauce, Ginger" },
                    { name: "Sourdough Avocado Toast", categories: ["Breakfast"], ingredients: "Bread, Avocado, Egg" }
                ];
            }
        }

        this.setupEventListeners();
        this.setupAgentChat();
    }

    setupEventListeners() {
        this.generateBtn.onclick = () => this.generatePlan();
        
        document.getElementById('start-live-shopping').onclick = () => {
            this.sendToHealthPick();
        };
        
        document.getElementById('view-shopping-list').onclick = () => {
            this.showView('shopping');
            this.renderShoppingList();
        };

        document.getElementById('back-to-plan').onclick = () => this.showView('dashboard');

        // Tab navigation
        document.querySelectorAll('.nav-items li').forEach(li => {
            li.onclick = () => {
                const tab = li.getAttribute('data-tab');
                this.showView(tab);
                
                document.querySelectorAll('.nav-items li').forEach(l => l.classList.remove('active'));
                li.classList.add('active');
            };
        });
    }

    showView(viewName) {
        this.setupView.classList.add('hidden');
        this.dashboardView.classList.add('hidden');
        this.shoppingView.classList.add('hidden');
        document.getElementById('library-view')?.classList.add('hidden');

        const content = document.getElementById('content');
        content.scrollTop = 0; // Reset scroll position when switching views

        if (viewName === 'planner') this.setupView.classList.remove('hidden');
        if (viewName === 'dashboard') this.dashboardView.classList.remove('hidden');
        if (viewName === 'shopping') this.shoppingView.classList.remove('hidden');
        if (viewName === 'recipes') {
            document.getElementById('library-view').classList.remove('hidden');
            this.renderLibrary();
        }
    }

    async generatePlan() {
        // Collect Profile
        this.profile = {
            familySize: parseInt(document.getElementById('family-size').value),
            dinnerCount: parseInt(document.getElementById('dinner-count').value),
            kidAge: document.getElementById('kid-age').value,
            mixLevel: document.getElementById('mix-level').value,
            packLunch: document.getElementById('lunch-pack').checked
        };

        // Try AI Agent Generation first
        try {
            this.generateBtn.innerText = "GENIE IS THINKING...";
            this.generateBtn.disabled = true;

            const response = await fetch('http://127.0.0.1:8000/api/plan', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    conversation_id: this.agentConversationId,
                    kid_age_range: this.profile.kidAge,
                    allergies: "",
                    diet: this.profile.mixLevel,
                    days: this.profile.dinnerCount
                })
            });

            if (!response.ok) throw new Error('API server returned error');

            const data = await response.json();
            this.agentConversationId = data.conversation_id;
            localStorage.setItem('mealgenie_agent_conv_id', this.agentConversationId);

            if (data.weekly_meal_plan && data.weekly_meal_plan.length > 0) {
                const updatedPlan = [];
                data.weekly_meal_plan.forEach(item => {
                    const recipeName = item.meal || item.recipe || item.name;
                    if (recipeName) {
                        const match = this.recipes.find(r => r.name.toLowerCase() === recipeName.toLowerCase());
                        if (match) {
                            updatedPlan.push(match);
                        } else {
                            updatedPlan.push({ name: recipeName, categories: ["AI Choice"], ingredients: "" });
                        }
                    }
                });
                if (updatedPlan.length > 0) {
                    this.currentPlan = updatedPlan;
                    this.renderPlan();
                    this.showView('dashboard');
                    return;
                }
            }
        } catch (err) {
            console.log("Falling back to local plan generation algorithm (Agent offline).", err);
        } finally {
            this.generateBtn.innerText = "GENERATE WEEKLY PLAN";
            this.generateBtn.disabled = false;
        }

        // Fallback Algorithm: Select recipes locally
        let shuffled = [...this.recipes].sort(() => 0.5 - Math.random());
        const isKidFriendly = (r) => {
            if (this.profile.kidAge === 'none') return true;
            const noGo = ['spicy', 'chili', 'bourbon', 'intense'];
            return !noGo.some(word => r.name.toLowerCase().includes(word));
        };

        this.currentPlan = shuffled
            .filter(isKidFriendly)
            .slice(0, this.profile.dinnerCount);

        this.renderPlan();
        this.showView('dashboard');
    }

    renderPlan() {
        this.mealGrid.innerHTML = '';
        const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

        this.currentPlan.forEach((recipe, idx) => {
            const card = document.createElement('div');
            card.className = 'meal-card';
            
            const hasLunch = this.profile.packLunch ? '<span class="tag lunch">LUNCH</span>' : '';
            
            card.innerHTML = `
                <span class="day">${days[idx] || 'Extra'} Dinner</span>
                <h3>${recipe.name}</h3>
                <div class="meta">
                    <button class="remove-btn">REMOVE</button>
                    ${hasLunch}
                </div>
            `;

            card.querySelector('.remove-btn').onclick = () => {
                this.currentPlan.splice(idx, 1);
                this.renderPlan();
            };

            this.mealGrid.appendChild(card);
        });
    }

    renderLibrary(filterCat = 'all') {
        const libContainer = document.getElementById('library-list');
        const countLabel = document.getElementById('library-count');
        const pillBar = document.getElementById('category-bar');
        
        // 1. Extract and render pills if not already done
        if (pillBar.children.length <= 1) {
            const cats = new Set();
            this.recipes.forEach(r => r.categories.forEach(c => cats.add(c)));
            [...cats].sort().forEach(c => {
                const p = document.createElement('button');
                p.className = 'pill';
                p.innerText = c;
                p.onclick = () => {
                    document.querySelectorAll('.pill').forEach(el => el.classList.remove('active'));
                    p.classList.add('active');
                    this.renderLibrary(c);
                };
                pillBar.appendChild(p);
            });
            // Initial 'All' pill click handler
            pillBar.children[0].onclick = () => {
                document.querySelectorAll('.pill').forEach(el => el.classList.remove('active'));
                pillBar.children[0].classList.add('active');
                this.renderLibrary('all');
            };
        }

        libContainer.innerHTML = '';
        
        const filtered = filterCat === 'all' 
            ? this.recipes 
            : this.recipes.filter(r => r.categories.includes(filterCat));

        countLabel.innerText = `${filtered.length} ${filterCat === 'all' ? 'Recipes' : filterCat + ' Favorites'}`;

        // Limit results for performance but allow more than before
        filtered.slice(0, 100).forEach(recipe => {
            const card = document.createElement('div');
            card.className = 'meal-card';
            card.innerHTML = `
                <span class="day">${recipe.categories[0] || 'General'}</span>
                <h3>${recipe.name}</h3>
                <button class="add-recipe-btn">SELECT</button>
            `;

            // Selection Logic
            card.querySelector('.add-recipe-btn').onclick = (e) => {
                e.stopPropagation();
                this.currentPlan.push(recipe);
                card.querySelector('.add-recipe-btn').innerText = "ADDED!";
                card.querySelector('.add-recipe-btn').style.background = "var(--accent)"; // Emerald/Mint for success
                
                // Show dashboard if we have recipes
                setTimeout(() => this.showView('dashboard'), 500);
                this.renderPlan();
            };

            libContainer.appendChild(card);
        });
    }

    renderShoppingList() {
        const listContainer = document.getElementById('shopping-list-categories');
        listContainer.innerHTML = '';

        // Simple mock grouping logic
        const categories = {
            "Produce": ["Garlic", "Spinach", "Onion", "Scallions", "Lemon"],
            "Protein": ["Chicken", "Salmon Fillets", "Ground Turkey"],
            "Pantry": ["Olive Oil", "Soy Sauce", "Bread Crumbs", "Pesto"]
        };

        for (const [cat, items] of Object.entries(categories)) {
            const group = document.createElement('div');
            group.className = 'category-group';
            group.innerHTML = `<h4>${cat}</h4>`;
            
            items.forEach(item => {
                // Scaling logic simulation
                const qty = this.profile.familySize > 4 ? 'Large Pack' : 'Standard';
                group.innerHTML += `
                    <div class="list-item">
                        <input type="checkbox">
                        <span>${item} (${qty})</span>
                    </div>
                `;
            });
            listContainer.appendChild(group);
        }
    }

    sendToHealthPick() {
        // Collect all items from the list
        const list = [
            "Chicken", "Salmon Fillets", "Ground Turkey", 
            "Garlic", "Spinach", "Onion", "Scallions", "Lemon",
            "Olive Oil", "Soy Sauce", "Bread Crumbs", "Pesto"
        ];
        
        // Store in localStorage for the Assistant app to pick up
        localStorage.setItem('mealmind_shopping_list', JSON.stringify({
            items: list,
            plan: this.currentPlan.map(r => r.name),
            timestamp: new Date().toISOString()
        }));

        // Redirect to the Assistant (Live) app
        window.location.href = "../live/index.html";
    }

    setupAgentChat() {
        this.chatDrawer = document.getElementById('ai-chat-drawer');
        this.chatToggle = document.getElementById('ai-chat-toggle');
        this.chatMessages = document.getElementById('ai-chat-messages');
        this.chatInput = document.getElementById('ai-chat-input');
        this.chatSend = document.getElementById('ai-chat-send');
        
        this.agentConversationId = localStorage.getItem('mealgenie_agent_conv_id') || null;

        // Toggle Expand/Collapse
        this.chatToggle.onclick = (e) => {
            e.stopPropagation();
            this.chatDrawer.classList.toggle('collapsed');
        };

        this.chatDrawer.onclick = (e) => {
            if (this.chatDrawer.classList.contains('collapsed')) {
                this.chatDrawer.classList.remove('collapsed');
            }
        };

        // Send message event
        this.chatSend.onclick = () => this.sendChatMessage();
        this.chatInput.onkeydown = (e) => {
            if (e.key === 'Enter') {
                this.sendChatMessage();
            }
        };
    }

    async sendChatMessage() {
        const text = this.chatInput.value.trim();
        if (!text) return;

        // Add user message to UI
        this.appendChatMessage(text, 'user');
        this.chatInput.value = '';

        // Add loading state
        const loadingId = this.appendChatMessage('Thinking...', 'agent loading');

        try {
            // Get profile values to pass to agent
            const kidAge = document.getElementById('kid-age').value;
            const dinnerCount = document.getElementById('dinner-count').value;
            const familySize = document.getElementById('family-size').value;

            const response = await fetch('http://127.0.0.1:8000/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: text,
                    conversation_id: this.agentConversationId,
                    kid_age_range: kidAge,
                    diet: document.getElementById('mix-level').value,
                    allergies: ""
                })
            });

            if (!response.ok) throw new Error('Server returned error');

            const data = await response.json();
            
            // Remove loading indicator
            const loadingElem = document.getElementById(loadingId);
            if (loadingElem) loadingElem.remove();

            // Update conversation ID
            this.agentConversationId = data.conversation_id;
            localStorage.setItem('mealgenie_agent_conv_id', this.agentConversationId);

            // Add agent response
            this.appendChatMessage(data.response, 'agent');

            // Handle weekly meal plan sync
            if (data.weekly_meal_plan && data.weekly_meal_plan.length > 0) {
                const updatedPlan = [];
                data.weekly_meal_plan.forEach(item => {
                    const recipeName = item.meal || item.recipe || item.name;
                    if (recipeName) {
                        const match = this.recipes.find(r => r.name.toLowerCase() === recipeName.toLowerCase());
                        if (match) {
                            updatedPlan.push(match);
                        } else {
                            updatedPlan.push({ name: recipeName, categories: ["AI Choice"], ingredients: "" });
                        }
                    }
                });
                if (updatedPlan.length > 0) {
                    this.currentPlan = updatedPlan;
                    this.renderPlan();
                    this.showView('dashboard');
                }
            }
        } catch (err) {
            console.error('Agent communication failed:', err);
            const loadingElem = document.getElementById(loadingId);
            if (loadingElem) loadingElem.remove();
            this.appendChatMessage('Could not connect to MealGenie Agent. Please check that the local server is running at http://127.0.0.1:8000.', 'agent');
        }
    }

    appendChatMessage(text, sender) {
        const msg = document.createElement('div');
        msg.className = `chat-message ${sender}`;
        msg.innerText = text;
        
        const id = 'msg-' + Math.random().toString(36).substr(2, 9);
        msg.id = id;

        this.chatMessages.appendChild(msg);
        this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
        return id;
    }
}

window.onclick = () => {
    // Audio context or interaction triggers here if needed
};

document.addEventListener('DOMContentLoaded', () => {
    new MealMind();
});
