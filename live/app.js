/**
 * HealthPick Live - Core Logic
 */

class HealthPickApp {
    constructor() {
        this.video = document.getElementById('video-stream');
        this.arOverlay = document.getElementById('ar-overlay');
        this.transcriptPreview = document.getElementById('transcript-preview');
        this.resultPanel = document.getElementById('result-panel');
        this.permissionOverlay = document.getElementById('permission-overlay');
        
        this.isAnalyzing = false;
        this.detectedProducts = [];
        this.mockProducts = [
            { id: 1, name: "Seaweed Snacks (Plain)", health: "A", reasoning: "Minimal ingredients, lowest sodium (20mg). No added sugar." },
            { id: 2, name: "Teriyaki Seaweed", health: "C+", reasoning: "High sugar content from glaze. 120mg sodium per serving." },
            { id: 3, name: "Seaweed Thins", health: "B", reasoning: "Good fiber, but contains palm oil. Moderate sodium." }
        ];

        this.init();
    }

    async init() {
        this.setupEventListeners();
        this.checkForStoredList();
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
    }

    checkForStoredList() {
        const stored = localStorage.getItem('mealmind_shopping_list');
        if (stored) {
            const list = JSON.parse(stored);
            this.transcriptPreview.innerText = `Ready to shop for ${list.length} meals! Point your camera at ingredients.`;
            this.speak(`I've loaded your plan for the week. Let's find your ingredients!`);
        }
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
            const transcript = Array.from(event.results)
                .map(result => result[0])
                .map(result => result.transcript)
                .join('');

            this.transcriptPreview.innerText = transcript;
            
            // Check for triggers
            const lowerTranscript = transcript.toLowerCase();
            if (lowerTranscript.includes("best") || lowerTranscript.includes("choose") || lowerTranscript.includes("pick")) {
                this.analyzeAndRecommend();
            }
        };

        this.recognition.onend = () => this.recognition.start(); // Keep listening
        this.recognition.start();
    }

    startLiveAnalysis() {
        // Every 3 seconds, simulate a "scan" of the shelf
        setInterval(() => {
            if (this.isAnalyzing) return;
            this.updateMarkers();
        }, 3000);
    }

    updateMarkers() {
        this.arOverlay.innerHTML = '';
        const count = Math.floor(Math.random() * 3) + 2; // 2 to 4 products
        
        for (let i = 0; i < count; i++) {
            const marker = document.createElement('div');
            marker.className = 'product-marker';
            
            // Random position in frame
            const top = 20 + Math.random() * 60;
            const left = 20 + Math.random() * 60;
            
            marker.style.top = `${top}%`;
            marker.style.left = `${left}%`;
            
            const label = document.createElement('div');
            label.className = 'label';
            label.innerText = `Product #${i + 1}`;
            marker.appendChild(label);
            
            this.arOverlay.appendChild(marker);
        }
    }

    analyzeAndRecommend() {
        if (this.isAnalyzing) return;
        this.isAnalyzing = true;

        // Vibrate if supported
        if (navigator.vibrate) navigator.vibrate(100);

        this.transcriptPreview.innerText = "Comparing labels...";
        
        // Pick the "best" one from our mock data
        const topPick = this.mockProducts[0];
        
        // Highlight one marker as "The One"
        const markers = document.querySelectorAll('.product-marker');
        if (markers.length > 0) {
            const winnerIdx = Math.floor(Math.random() * markers.length);
            markers[winnerIdx].classList.add('best');
            markers[winnerIdx].querySelector('.label').innerText = "TOP PICK";
        }

        setTimeout(() => {
            this.showResult(topPick);
        }, 1500);
    }

    showResult(product) {
        document.getElementById('product-name').innerText = product.name;
        document.getElementById('health-summary').innerText = "Nutri-Score: " + product.health;
        document.getElementById('reasoning-text').innerText = product.reasoning;
        
        this.resultPanel.classList.remove('hidden');
        this.speak(`I recommend the ${product.name}. ${product.reasoning}`);
    }

    hideResult() {
        this.resultPanel.classList.add('hidden');
        this.isAnalyzing = false;
        this.transcriptPreview.innerText = "Listening for commands...";
    }

    speak(text) {
        if (!window.speechSynthesis) return;
        
        // Cancel any ongoing speech
        window.speechSynthesis.cancel();
        
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 1.0;
        utterance.pitch = 1.0;
        utterance.volume = 1.0;
        
        window.speechSynthesis.speak(utterance);
    }
}

// Start app when DOM is ready
window.addEventListener('DOMContentLoaded', () => {
    new HealthPickApp();
});
