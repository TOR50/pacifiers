// Background Service Worker
// Handles API calls to avoid CORS if necessary, and manages state

let perspectiveApiKey = '';
const DO_NOT_TRACK_DOMAINS = [];

// Initialize
chrome.runtime.onInstalled.addListener(() => {
    // Set defaults
    chrome.storage.sync.get(['enabled', 'mode', 'stats'], (result) => {
        if (result.enabled === undefined) chrome.storage.sync.set({ enabled: true });
        if (result.mode === undefined) chrome.storage.sync.set({ mode: 'medium' });
        if (result.stats === undefined) chrome.storage.sync.set({ stats: { blockedToday: 0, totalBlocked: 0, lastReset: new Date().toDateString() } });
    });
});

// Update key from storage on load/change
chrome.storage.sync.get(['apiKey'], (result) => {
    if (result.apiKey) perspectiveApiKey = result.apiKey;
});

chrome.storage.onChanged.addListener((changes, namespace) => {
    if (changes.apiKey) {
        perspectiveApiKey = changes.apiKey.newValue;
    }
});

// Message Listener
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'ANALYZE_TEXT') {
        analyzeText(message.payload)
            .then(score => sendResponse({ success: true, score: score }))
            .catch(err => sendResponse({ success: false, error: err.message }));
        return true; // Keep channel open for async response
    } else if (message.type === 'INCREMENT_STATS') {
        incrementStats();
    }
});

async function analyzeText(text) {
    if (!perspectiveApiKey) {
        console.warn("No Perspective API key set.");
        return 0; // Treat as safe if no key
    }

    const url = `https://commentanalyzer.googleapis.com/v1alpha1/comments:analyze?key=${perspectiveApiKey}`;

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                comment: { text: text },
                languages: ["en"],
                requestedAttributes: {
                    TOXICITY: {},
                    SEVERE_TOXICITY: {},
                    INSULT: {}
                }
            })
        });

        const data = await response.json();

        if (data.error) {
            console.error("Perspective API Error:", data.error);
            return 0;
        }

        const scores = data.attributeScores;
        // Simple logic: Max of the requested attributes
        const toxicity = scores.TOXICITY?.summaryScore?.value || 0;
        const severe = scores.SEVERE_TOXICITY?.summaryScore?.value || 0;
        const insult = scores.INSULT?.summaryScore?.value || 0;

        return Math.max(toxicity, severe, insult);
    } catch (error) {
        console.error("Network Error:", error);
        return 0;
    }
}

function incrementStats() {
    chrome.storage.sync.get(['stats'], (result) => {
        let stats = result.stats || { blockedToday: 0, totalBlocked: 0, lastReset: new Date().toDateString() };

        // Reset daily stats if new day
        const today = new Date().toDateString();
        if (stats.lastReset !== today) {
            stats.blockedToday = 0;
            stats.lastReset = today;
        }

        stats.blockedToday++;
        stats.totalBlocked++;

        chrome.storage.sync.set({ stats: stats });

        // Notify popup if open
        chrome.runtime.sendMessage({ type: 'STATS_UPDATED', payload: stats }).catch(() => {
            // Popup might be closed, ignore
        });
    });
}
