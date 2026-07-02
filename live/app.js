/**
 * MealGenie Live Assistant - Core Logic
 */

// Global Remote Debugging Logger
window.onerror = function(message, source, lineno, colno, error) {
    alert("JavaScript Error: " + message + "\nFile: " + source + "\nLine: " + lineno);
    return false;
};

window.onunhandledrejection = function(event) {
    alert("Unhandled Promise Rejection: " + event.reason);
};

class MealGenieLiveAssistant {
    constructor() {
        this.video = document.getElementById('video-stream');
        this.arOverlay = document.getElementById('ar-overlay');
        this.transcriptPreview = document.getElementById('transcript-preview');
        this.resultPanel = document.getElementById('result-panel');
        this.permissionOverlay = document.getElementById('permission-overlay');
        this.scannerNav = document.getElementById('scanner-nav');
        this.searchInput = document.getElementById('search-input');
        
        // Eleven Labs UI elements
        this.settingsModal = document.getElementById('settings-modal');
        this.settingsCog = document.getElementById('settings-cog');
        this.elevenApiKeyInput = document.getElementById('eleven-api-key');
        this.saveSettingsBtn = document.getElementById('save-settings-btn');
        this.closeSettingsBtn = document.getElementById('close-settings-btn');
        
        this.isAnalyzing = false;
        this.selectedProduct = null;
        this.speechInitialized = false;
        this.audioPlayer = new Audio();
        this.audioPlayerInitialized = false;
        this.model = null; // MobileNet model
        
        // Retrieve keys from local storage
        this.elevenLabsKey = localStorage.getItem('elevenlabs_api_key') || '';

        // Rich Product Database mapping specific brands, scores, and screen positions
        this.productDatabase = {
            "Soda & Beverages": {
                items: [
                    { name: "Maison Perrier", health: "A", reasoning: "Zero sugar, zero calories, naturally carbonated water. Excellent healthy alternative.", best: true },
                    { name: "Classic Coca-Cola", health: "E", reasoning: "Extremely high sugar content (39g per can), high glycemic index, phosphoric acid. Avoid.", best: false }
                ],
                positions: [
                    { top: 52, left: 24 }, // Over Perrier can (yellow box)
                    { top: 48, left: 51 }  // Over Coke can (green box)
                ]
            },
            "Seaweed": {
                items: [
                    { name: "Organic Seaweed (Plain)", health: "A", reasoning: "Minimal ingredients, lowest sodium (20mg). Matches your healthy kid-friendly profile.", best: true },
                    { name: "Teriyaki Seaweed", health: "C+", reasoning: "High sugar content from glaze. 120mg sodium per serving. Recommend avoiding for kids.", best: false },
                    { name: "Seaweed Thins", health: "B", reasoning: "Good fiber, but contains palm oil and moderate sodium.", best: false }
                ],
                positions: [
                    { top: 45, left: 25 },
                    { top: 42, left: 50 },
                    { top: 45, left: 75 }
                ]
            },
            "Pesto": {
                items: [
                    { name: "Organico Basil Pesto", health: "A", reasoning: "Made with extra virgin olive oil, fresh organic basil, and minimal sodium (90mg).", best: true },
                    { name: "Prego Basil Pesto", health: "B", reasoning: "Uses sunflower oil base, contains standard cheese cultures and moderate sodium (210mg).", best: false },
                    { name: "Creamy Basil Pesto Sauce", health: "D", reasoning: "Contains heavy cream, hydrogenated oils, high saturated fats, and high sodium (380mg).", best: false }
                ],
                positions: [
                    { top: 45, left: 25 },
                    { top: 42, left: 50 },
                    { top: 45, left: 75 }
                ]
            },
            "Soy Sauce": {
                items: [
                    { name: "Organic Tamari (Low Sodium)", health: "A", reasoning: "Gluten-free, fermented organic soy, and 50% less sodium than standard brands.", best: true },
                    { name: "Classic Soy Sauce", health: "C", reasoning: "Contains wheat gluten, preservatives, and extremely high sodium (920mg per tablespoon).", best: false },
                    { name: "Coconut Aminos Alternative", health: "B", reasoning: "Low sodium, soy-free, slightly sweet flavor. Good alternative but high price.", best: false }
                ],
                positions: [
                    { top: 45, left: 25 },
                    { top: 42, left: 50 },
                    { top: 45, left: 75 }
                ]
            },
            "Olive Oil": {
                items: [
                    { name: "Extra Virgin Olive Oil", health: "A", reasoning: "Rich in antioxidants, zero chemical processing, pure monounsaturated healthy fats.", best: true },
                    { name: "Pure Olive Oil Blend", health: "B-", reasoning: "Refined oil blend, heated and chemically treated, lower antioxidant profile.", best: false },
                    { name: "Vegetable Cooking Oil", health: "D", reasoning: "Blend of corn, canola, and soy oils. High in omega-6 processed fats. Avoid.", best: false }
                ],
                positions: [
                    { top: 45, left: 25 },
                    { top: 42, left: 50 },
                    { top: 45, left: 75 }
                ]
            },
            "Chips & Snacks": {
                items: [
                    { name: "Baked Lentil Chips", health: "A", reasoning: "High protein and fiber, baked instead of fried, 60% less fat and low sodium.", best: true },
                    { name: "Classic Potato Chips", health: "D", reasoning: "Deep-fried in seed oils, high sodium, high saturated fat, and zero fiber.", best: false }
                ],
                positions: [
                    { top: 45, left: 30 },
                    { top: 45, left: 70 }
                ]
            },
            "Yogurt & Dairy": {
                items: [
                    { name: "Plain Greek Yogurt", health: "A", reasoning: "Prebiotics, high protein (15g), zero added sugars or gums. Excellent calcium source.", best: true },
                    { name: "Strawberry Yogurt", health: "C", reasoning: "Low fat, but contains 16g of added cane sugar and artificial red colorings.", best: false }
                ],
                positions: [
                    { top: 45, left: 30 },
                    { top: 45, left: 70 }
                ]
            },
            "Salmon": {
                items: [
                    { name: "Wild Sockeye Salmon", health: "A", reasoning: "High in Omega-3 fatty acids, sustainable, and free of antibiotics or artificial colorings.", best: true },
                    { name: "Atlantic Farmed Salmon", health: "B", reasoning: "Good Omega-3 source, but higher fat content and risk of farmed antibiotics.", best: false }
                ],
                positions: [
                    { top: 45, left: 30 },
                    { top: 45, left: 70 }
                ]
            },
            "Chicken": {
                items: [
                    { name: "Organic Chicken Breast", health: "A", reasoning: "No hormones, lean protein, no retained water weight. Organic and humane.", best: true },
                    { name: "Standard Chicken Breast", health: "B", reasoning: "Lean protein, but standard processing adds up to 15% sodium water solution.", best: false }
                ],
                positions: [
                    { top: 52, left: 24 },
                    { top: 48, left: 51 }
                ]
            },
            "Turkey": {
                items: [
                    { name: "Organic Ground Turkey", health: "A", reasoning: "93% lean, organic certification, no antibiotics or artificial fillers.", best: true },
                    { name: "Classic Ground Turkey", health: "B", reasoning: "85% lean, contains dark meat parts, higher saturated fat content.", best: false }
                ],
                positions: [
                    { top: 45, left: 30 },
                    { top: 45, left: 70 }
                ]
            },
            "Garlic": {
                items: [
                    { name: "Fresh Garlic Bulbs", health: "A", reasoning: "Zero processing, natural allicin compound. Maximum flavor and health benefits.", best: true },
                    { name: "Minced Garlic in Water", health: "B", reasoning: "Convenient, but processed, contains citric acid and pasteurized shelf stabilizers.", best: false }
                ],
                positions: [
                    { top: 45, left: 30 },
                    { top: 45, left: 70 }
                ]
            },
            "Spinach": {
                items: [
                    { name: "Organic Baby Spinach", health: "A", reasoning: "Pre-washed organic spinach. Rich in iron, folate, and vitamins. No chemical pesticides.", best: true },
                    { name: "Standard Frozen Spinach", health: "B", reasoning: "Nutritious, but contains added sodium and is blanched, losing some vitamin C.", best: false }
                ],
                positions: [
                    { top: 45, left: 30 },
                    { top: 45, left: 70 }
                ]
            }
        };
        
        this.activeCategory = "Seaweed";
        this.categories = Object.keys(this.productDatabase);
        this.shoppingList = [];
        
        this.init();
    }

    async init() {
        this.setupEventListeners();
        this.checkForStoredList();
        this.renderCategoryNav();
        
        try {
            await this.startCamera();
            this.setupVoiceRecognition();
            this.startLiveAnalysis();
        } catch (err) {
            console.error("Initialization failed:", err);
            this.permissionOverlay.classList.remove('hidden');
        }
    }

    setupEventListeners() {
        document.getElementById('grant-btn').onclick = () => {
            this.permissionOverlay.classList.add('hidden');
            this.init();
        };

        document.getElementById('dismiss-btn').onclick = () => {
            this.hideResult();
        };

        // Text Search Listener
        this.searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                const query = this.searchInput.value.trim();
                if (query) {
                    this.performSearch(query);
                }
            }
        });

        // Settings Cog Modal Trigger
        this.settingsCog.onclick = (e) => {
            e.stopPropagation();
            this.elevenApiKeyInput.value = this.elevenLabsKey;
            this.settingsModal.classList.remove('hidden');
        };

        this.closeSettingsBtn.onclick = (e) => {
            e.stopPropagation();
            this.settingsModal.classList.add('hidden');
        };

        this.saveSettingsBtn.onclick = (e) => {
            e.stopPropagation();
            this.elevenLabsKey = this.elevenApiKeyInput.value.trim();
            localStorage.setItem('elevenlabs_api_key', this.elevenLabsKey);
            this.settingsModal.classList.add('hidden');
            this.speak("Eleven Labs voice settings updated successfully.");
        };

        // Screen click to initialize SpeechSynthesis and Audio Player (browser permission check)
        // We use capturing phase (true) so it triggers on all clicks before stopPropagation
        document.addEventListener('click', () => {
            this.unlockAudioAndSpeech();
        }, true);

        // Microphone Icon click handler to force listen / trigger recommendation
        const micIcon = document.getElementById('voice-indicator');
        if (micIcon) {
            micIcon.style.cursor = 'pointer';
            micIcon.onclick = (e) => {
                e.stopPropagation();
                this.unlockAudioAndSpeech();
                this.transcriptPreview.innerText = "Querying MealGenie Agent...";
                this.analyzeAndRecommend();
            };
        }
    }

    unlockAudioAndSpeech() {
        if (window.speechSynthesis && !this.speechInitialized) {
            try {
                const u = new SpeechSynthesisUtterance('');
                window.speechSynthesis.speak(u);
                this.speechInitialized = true;
                console.log("Speech synthesis context initialized.");
            } catch (e) {
                console.log("Speech synthesis unlock failed:", e);
            }
        }
        if (this.audioPlayer && !this.audioPlayerInitialized) {
            this.audioPlayer.src = "data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAAA";
            this.audioPlayer.play()
                .then(() => {
                    this.audioPlayerInitialized = true;
                    console.log("Audio player context unlocked.");
                })
                .catch(e => console.log("Audio unlock failed:", e));
        }
    }

    checkForStoredList() {
        const stored = localStorage.getItem('mealmind_shopping_list');
        if (stored) {
            const data = JSON.parse(stored);
            this.shoppingList = data.items || [];
            
            // Map shopping list items to available database categories
            const matchedCats = [];
            this.shoppingList.forEach(item => {
                const cat = this.mapItemToCategory(item);
                if (cat && !matchedCats.includes(cat)) {
                    matchedCats.push(cat);
                }
            });

            // Prepend Soda & Beverages so it is easily accessible for demo purposes
            if (!matchedCats.includes("Soda & Beverages")) {
                matchedCats.push("Soda & Beverages");
            }
            
            if (matchedCats.length > 0) {
                this.categories = matchedCats;
                this.activeCategory = matchedCats[0];
                
                this.transcriptPreview.innerText = `Guided Mode: Scan shelf for ${this.activeCategory}.`;
                setTimeout(() => {
                    this.speak(`Welcome back! let's start with ${this.activeCategory}.`);
                }, 1000);
            } else {
                this.setupFreeScan();
            }
        } else {
            this.setupFreeScan();
        }
    }

    setupFreeScan() {
        this.categories = Object.keys(this.productDatabase);
        this.activeCategory = "Soda & Beverages"; // Default to soda for easier demoing
        this.transcriptPreview.innerText = `Free Scan Mode: Scan shelf for Soda.`;
        setTimeout(() => {
            this.speak("Welcome to MealGenie Live. Scan the shelf for soda, or use the search bar to find chips, yogurt, and other items.");
        }, 1000);
    }

    mapItemToCategory(item) {
        const lower = item.toLowerCase();
        if (lower.includes("chicken")) return "Chicken";
        if (lower.includes("salmon")) return "Salmon";
        if (lower.includes("turkey")) return "Turkey";
        if (lower.includes("garlic")) return "Garlic";
        if (lower.includes("spinach")) return "Spinach";
        if (lower.includes("olive oil")) return "Olive Oil";
        if (lower.includes("soy sauce")) return "Soy Sauce";
        if (lower.includes("pesto")) return "Pesto";
        return null;
    }

    performSearch(query) {
        const lowerQuery = query.toLowerCase();
        let matchedCat = null;
        
        // 1. Check for database category keys directly
        for (const cat of Object.keys(this.productDatabase)) {
            if (cat.toLowerCase().includes(lowerQuery) || lowerQuery.includes(cat.toLowerCase())) {
                matchedCat = cat;
                break;
            }
        }
        
        // 2. Map synonyms and common search terms
        if (!matchedCat) {
            if (lowerQuery.includes("coke") || lowerQuery.includes("perrier") || lowerQuery.includes("soda") || lowerQuery.includes("pop") || lowerQuery.includes("water") || lowerQuery.includes("drink") || lowerQuery.includes("beverage")) {
                matchedCat = "Soda & Beverages";
            } else if (lowerQuery.includes("chip") || lowerQuery.includes("snack") || lowerQuery.includes("crisp") || lowerQuery.includes("lentil")) {
                matchedCat = "Chips & Snacks";
            } else if (lowerQuery.includes("yogurt") || lowerQuery.includes("dairy") || lowerQuery.includes("greek") || lowerQuery.includes("milk")) {
                matchedCat = "Yogurt & Dairy";
            }
        }
        
        if (matchedCat) {
            if (!this.categories.includes(matchedCat)) {
                this.categories.push(matchedCat);
                this.renderCategoryNav();
            }
            this.setCategory(matchedCat);
            this.searchInput.value = ''; // Clear search bar
            this.searchInput.blur();
        } else {
            this.transcriptPreview.innerText = `No items found matching "${query}"`;
            this.speak(`Sorry, I couldn't find any products matching ${query}. Try searching for soda, chips, or yogurt.`);
        }
    }

    renderCategoryNav() {
        this.scannerNav.innerHTML = '';
        this.categories.forEach(cat => {
            const pill = document.createElement('button');
            pill.className = `scanner-pill ${cat === this.activeCategory ? 'active' : ''}`;
            pill.innerText = cat;
            pill.onclick = (e) => {
                e.stopPropagation();
                this.setCategory(cat);
            };
            this.scannerNav.appendChild(pill);
        });
    }

    setCategory(cat) {
        if (this.activeCategory === cat) return;
        
        this.activeCategory = cat;
        
        // Update nav UI
        document.querySelectorAll('.scanner-pill').forEach(pill => {
            if (pill.innerText === cat) {
                pill.classList.add('active');
            } else {
                pill.classList.remove('active');
            }
        });
        
        this.hideResult();
        this.transcriptPreview.innerText = `Scanning for ${cat}...`;
        this.speak(`Now scanning for ${cat}.`);
        this.updateMarkers();
    }

    setCategorySilently(cat) {
        if (this.activeCategory === cat) return;
        
        this.activeCategory = cat;
        
        // Update nav UI
        document.querySelectorAll('.scanner-pill').forEach(pill => {
            if (pill.innerText === cat) {
                pill.classList.add('active');
            } else {
                pill.classList.remove('active');
            }
        });
        
        this.hideResult();
        this.transcriptPreview.innerText = `AI Vision: Detected ${cat}.`;
        this.updateMarkers();
    }

    async startCamera() {
        const constraints = {
            video: { facingMode: 'environment' },
            audio: false
        };
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        this.video.srcObject = stream;
        return new Promise(resolve => this.video.onloadedmetadata = resolve);
    }

    setupVoiceRecognition() {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            this.transcriptPreview.innerText = "Voice recognition not supported";
            return;
        }

        this.recognition = new SpeechRecognition();
        this.recognition.continuous = true;
        this.recognition.interimResults = true;
        this.recognition.lang = 'en-US';

        this.recognition.onresult = (event) => {
            const lastResultIndex = event.results.length - 1;
            if (!event.results[lastResultIndex].isFinal) return; // Only parse final utterances
            
            const transcript = event.results[lastResultIndex][0].transcript.trim();
            this.transcriptPreview.innerText = `Voice: "${transcript}"`;
            
            const lower = transcript.toLowerCase();
            
            // 1. Check for category change command
            let categorySwitched = false;
            for (const cat of this.categories) {
                if (lower.includes(cat.toLowerCase())) {
                    this.setCategory(cat);
                    categorySwitched = true;
                    break;
                }
            }
            
            if (categorySwitched) return;
            
            // 2. Check for recommendation triggers
            if (lower.includes("best") || lower.includes("choose") || lower.includes("pick") || lower.includes("healthiest") || lower.includes("recommend")) {
                this.analyzeAndRecommend();
                return;
            }
            
            // 3. Check for specific product names on the current shelf
            const catData = this.productDatabase[this.activeCategory];
            const products = catData ? catData.items : [];
            let matchedProduct = null;
            
            for (const prod of products) {
                const words = prod.name.toLowerCase().split(/\s+/);
                const keyWords = words.filter(w => w.length > 3 && w !== "sauce" && w !== "snack" && w !== "snacks" && w !== "blend");
                if (keyWords.some(word => lower.includes(word))) {
                    matchedProduct = prod;
                    break;
                }
            }
            
            if (matchedProduct) {
                this.selectProduct(matchedProduct);
            }
        };

        this.recognition.onend = () => {
            try {
                this.recognition.start(); // Keep listening
            } catch (e) {
                // Ignore start errors
            }
        };
        
        try {
            this.recognition.start();
        } catch (e) {
            console.warn("Speech recognition immediate start failed:", e);
        }
    }

    async startLiveAnalysis() {
        this.updateMarkers();
        
        // 1. Load MobileNet Model Client-Side
        if (window.mobilenet) {
            this.transcriptPreview.innerText = "Loading AI Vision Classifier...";
            try {
                this.model = await window.mobilenet.load();
                this.transcriptPreview.innerText = "AI Vision Enabled. Point at shelf.";
                console.log("MobileNet model initialized.");
            } catch (err) {
                console.error("MobileNet failed to load:", err);
                this.transcriptPreview.innerText = "AI Vision offline. Using manual navigation.";
            }
        } else {
            console.warn("MobileNet library not found. Falling back to manual search.");
        }
        
        // 2. Run real-time feed classifier loop every 2.5s
        setInterval(async () => {
            if (this.isAnalyzing) return;
            
            if (this.model && this.video.readyState === 4) {
                await this.classifyFrame();
            } else {
                this.updateMarkers();
            }
        }, 2500);
    }

    async classifyFrame() {
        try {
            const predictions = await this.model.classify(this.video);
            console.log("AI Vision Predictions:", predictions);
            
            if (predictions && predictions.length > 0) {
                let matchedCategory = null;
                
                for (const pred of predictions) {
                    const label = pred.className.toLowerCase();
                    
                    // Match standard ImageNet class labels to our database categories
                    if (label.includes("pop bottle") || label.includes("can") || label.includes("beer bottle") || label.includes("coke") || label.includes("water bottle") || label.includes("espresso") || label.includes("beverage") || label.includes("carbonated")) {
                        matchedCategory = "Soda & Beverages";
                        break;
                    } else if (label.includes("packet") || label.includes("bag") || label.includes("pretzel") || label.includes("popcorn") || label.includes("potato chip") || label.includes("chips") || label.includes("snack") || label.includes("crisp")) {
                        matchedCategory = "Chips & Snacks";
                        break;
                    } else if (label.includes("sauce") || label.includes("pesto") || label.includes("pot") || label.includes("carbonara") || label.includes("spaghetti")) {
                        matchedCategory = "Pesto";
                        break;
                    } else if (label.includes("carton") || label.includes("tub") || label.includes("yogurt") || label.includes("milk")) {
                        matchedCategory = "Yogurt & Dairy";
                        break;
                    } else if (label.includes("oil") || label.includes("bottle") || label.includes("vinegar")) {
                        matchedCategory = "Olive Oil";
                        break;
                    } else if (label.includes("chicken") || label.includes("hen") || label.includes("meat") || label.includes("poultry")) {
                        matchedCategory = "Chicken";
                        break;
                    } else if (label.includes("garlic") || label.includes("onion")) {
                        matchedCategory = "Garlic";
                        break;
                    } else if (label.includes("fish") || label.includes("salmon")) {
                        matchedCategory = "Salmon";
                        break;
                    } else if (label.includes("spinach") || label.includes("cabbage") || label.includes("lettuce")) {
                        matchedCategory = "Spinach";
                        break;
                    }
                }
                
                if (matchedCategory && matchedCategory !== this.activeCategory) {
                    this.setCategorySilently(matchedCategory);
                }
            }
        } catch (e) {
            console.error("Error classifying video frame:", e);
        }
        
        this.updateMarkers();
    }

    updateMarkers() {
        this.arOverlay.innerHTML = '';
        const catData = this.productDatabase[this.activeCategory];
        if (!catData) return;

        const products = catData.items || [];
        const positions = catData.positions || [];

        products.forEach((product, idx) => {
            if (idx >= positions.length) return; // Limit to defined positions
            
            const pos = positions[idx];
            const marker = document.createElement('div');
            marker.className = 'product-marker';
            
            // Highlight selected/best state
            if (this.selectedProduct && this.selectedProduct.name === product.name) {
                marker.classList.add('selected');
            } else if (product.best && this.isAnalyzing) {
                marker.classList.add('best');
            }
            
            marker.style.top = `${pos.top}%`;
            marker.style.left = `${pos.left}%`;
            
            const label = document.createElement('div');
            label.className = 'label';
            label.innerText = product.name;
            marker.appendChild(label);
            
            // Touch/Click Interaction
            marker.onclick = (e) => {
                e.stopPropagation();
                this.unlockAudioAndSpeech();
                this.selectProduct(product);
            };
            
            this.arOverlay.appendChild(marker);
        });
    }

    selectProduct(product) {
        this.selectedProduct = product;
        this.isAnalyzing = true;
        this.updateMarkers();
        this.showResult(product);
    }

    async analyzeAndRecommend() {
        if (navigator.vibrate) navigator.vibrate(100);

        this.transcriptPreview.innerText = "Querying MealGenie Agent...";
        
        const catData = this.productDatabase[this.activeCategory];
        const products = catData ? catData.items : [];
        const bestPick = products.find(p => p.best) || products[0];

        try {
            // Retrieve conversation ID from localStorage
            this.agentConversationId = localStorage.getItem('mealgenie_agent_conv_id') || null;

            // Formulate prompt
            const prompt = `I am at the grocery store scanning the '${this.activeCategory}' category. The products on the shelf are: ${JSON.stringify(products)}. Which one is the absolute best choice for my family? Give me a concise recommendation starting with 'I recommend choosing [Product Name].' followed by a 2-sentence explanation of why it is better than the other options.`;

            const response = await fetch('http://127.0.0.1:8000/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: prompt,
                    conversation_id: this.agentConversationId
                })
            });

            if (!response.ok) throw new Error('API offline');

            const data = await response.json();
            
            // Save conversation ID
            this.agentConversationId = data.conversation_id;
            localStorage.setItem('mealgenie_agent_conv_id', this.agentConversationId);

            // Parse response to find which product was selected
            let selected = bestPick;
            for (const prod of products) {
                if (data.response.toLowerCase().includes(prod.name.toLowerCase())) {
                    selected = prod;
                    break;
                }
            }

            // Update product reasoning with agent's real explanation!
            selected.reasoning = data.response;
            this.selectProduct(selected);
            return;
        } catch (err) {
            console.log("Agent offline, falling back to local vision heuristics.", err);
        }

        // Local fallback
        if (bestPick) {
            this.selectProduct(bestPick);
        }
    }

    showResult(product) {
        document.getElementById('product-name').innerText = product.name;
        document.getElementById('health-summary').innerText = "Nutri-Score: " + product.health;
        
        const catData = this.productDatabase[this.activeCategory];
        const products = catData ? catData.items : [];
        const bestPick = products.find(p => p.best);
        
        const badge = document.querySelector('.badge');
        const reasoningHeader = document.querySelector('.reasoning-box h3');
        const reasoningText = document.getElementById('reasoning-text');
        
        let ttsText = "";
        
        if (product.best) {
            badge.style.display = 'block';
            badge.className = 'badge';
            badge.innerText = 'TOP PICK';
            badge.style.color = '#ffd700'; // Gold
            
            reasoningHeader.innerText = 'WHY THIS ONE?';
            reasoningText.innerText = `${product.reasoning} It is the healthiest choice compared to alternatives like ${products.filter(p => !p.best).map(p => p.name).join(', ')}.`;
            
            ttsText = `I recommend choosing ${product.name}. Its nutri-score is ${product.health}. ${product.reasoning}`;
        } else {
            badge.style.display = 'block';
            badge.className = 'badge warning';
            badge.innerText = 'ALTERNATIVE AVAILABLE';
            badge.style.color = '#ef4444'; // Red
            
            reasoningHeader.innerText = `COMPARED TO TOP PICK (${bestPick ? bestPick.name : 'None'})`;
            reasoningText.innerText = `${product.name} (Grade ${product.health}) is not recommended. It ${product.reasoning.toLowerCase()} In comparison, our Top Pick "${bestPick ? bestPick.name : 'None'}" (Grade A) is a much healthier option. We recommend choosing "${bestPick ? bestPick.name : 'None'}" instead.`;
            
            ttsText = `${product.name} is not recommended due to lower nutritional rating. I recommend choosing the healthier alternative, ${bestPick ? bestPick.name : 'Maison Perrier'}, instead.`;
        }
        
        // Dynamically style Nutri-Score pill
        const scorePill = document.querySelector('.score-pill');
        scorePill.innerText = product.health.charAt(0);
        
        const score = product.health.charAt(0);
        if (score === 'A') {
            scorePill.style.background = '#10b981'; // Mint Green
        } else if (score === 'B') {
            scorePill.style.background = '#8dc63f'; // Light Green
        } else if (score === 'C') {
            scorePill.style.background = '#fdb913'; // Yellow
        } else if (score === 'D') {
            scorePill.style.background = '#f97316'; // Orange
        } else {
            scorePill.style.background = '#ef4444'; // Soft Red (E)
        }

        // Render Other Shelf Alternatives (even out of immediate picture scope)
        const alternativesList = document.getElementById('alternatives-list');
        alternativesList.innerHTML = '';
        
        const otherOptions = products.filter(p => p.name !== product.name);
        if (otherOptions.length > 0) {
            document.getElementById('shelf-alternatives').style.display = 'block';
            otherOptions.forEach(opt => {
                const item = document.createElement('div');
                item.className = 'alternative-item';
                
                // Set grade background color
                let gradeColor = '#ef4444';
                if (opt.health.charAt(0) === 'A') gradeColor = '#10b981';
                else if (opt.health.charAt(0) === 'B') gradeColor = '#8dc63f';
                else if (opt.health.charAt(0) === 'C') gradeColor = '#fdb913';
                else if (opt.health.charAt(0) === 'D') gradeColor = '#f97316';
                
                item.innerHTML = `
                    <span>${opt.name} ${opt.best ? '🌟' : ''}</span>
                    <span class="item-grade" style="background: ${gradeColor}">${opt.health.charAt(0)}</span>
                `;
                alternativesList.appendChild(item);
            });
        } else {
            document.getElementById('shelf-alternatives').style.display = 'none';
        }

        this.resultPanel.classList.remove('hidden');
        this.speak(ttsText);
    }

    hideResult() {
        this.resultPanel.classList.add('hidden');
        this.isAnalyzing = false;
        this.selectedProduct = null;
        this.transcriptPreview.innerText = `Scanning for ${this.activeCategory}...`;
        this.updateMarkers();
    }

    async speakElevenLabs(text) {
        if (!this.elevenLabsKey) return false;
        
        try {
            const voiceId = "DXFkLCBUTmvXpp2QwZjA";
            const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "xi-api-key": this.elevenLabsKey
                },
                body: JSON.stringify({
                    text: text,
                    model_id: "eleven_monolingual_v1",
                    voice_settings: {
                        stability: 0.5,
                        similarity_boost: 0.75
                    }
                })
            });
            
            if (!response.ok) {
                console.error("Eleven Labs API error status:", response.status);
                return false;
            }
            
            const blob = await response.blob();
            const audioUrl = URL.createObjectURL(blob);
            const audio = new Audio(audioUrl);
            audio.play();
            return true;
        } catch (e) {
            console.error("Eleven Labs API error:", e);
            return false;
        }
    }

    async speak(text) {
        // Try Eleven Labs first if key is present
        if (this.elevenLabsKey) {
            const success = await this.speakElevenLabs(text);
            if (success) return;
        }
        
        // Fallback to browser's SpeechSynthesis
        if (!window.speechSynthesis) return;
        
        window.speechSynthesis.cancel(); // Cancel any ongoing feedback
        
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 1.05;
        utterance.pitch = 1.0;
        utterance.volume = 1.0;
        
        window.speechSynthesis.speak(utterance);
    }
}

// Start app when DOM is ready
window.addEventListener('DOMContentLoaded', () => {
    new MealGenieLiveAssistant();
});
