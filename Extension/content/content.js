// Pacifiers Content Script

// State
let isEnabled = true;
let currentMode = 'medium'; // light, medium, strong
let processedNodes = new WeakSet();
const BATCH_SIZE = 5;
const BATCH_DELAY = 1000;
let analysisQueue = [];
let isProcessingQueue = false;

// Debug logging
function log(msg, ...args) {
    console.log(`[Pacifiers] ${msg}`, ...args);
}

// Platform Selectors
const PLATFORMS = {
    TWITTER: {
        host: ['twitter.com', 'x.com'],
        selector: '[data-testid="tweetText"]',
        container: 'article'
    },
    REDDIT: {
        host: ['reddit.com'],
        selector: 'div[data-testid="comment"] p, .RichTextJSON-root p, .md p',
        container: 'div[data-testid="comment"]'
    },
    YOUTUBE: {
        host: ['youtube.com'],
        selector: '#content-text',
        container: 'ytd-comment-thread-renderer'
    },
    INSTAGRAM: {
        host: ['instagram.com'],
        selector: '._a9zs',
        container: 'ul._a9ym'
    },
    GENERIC: {
        host: [],
        selector: '[data-testid="tweetText"], #content-text, div[data-testid="comment"] p',
        container: 'body'
    }
};

// Identify current platform
function getPlatform() {
    const hostname = window.location.hostname;
    for (const key in PLATFORMS) {
        if (key === 'GENERIC') continue;
        if (PLATFORMS[key].host.some(h => hostname.includes(h))) {
            return PLATFORMS[key];
        }
    }
    // Fallback for test bench or other sites
    return PLATFORMS.GENERIC;
}

const currentPlatform = getPlatform();

// Initialization
chrome.storage.sync.get(['enabled', 'mode'], (result) => {
    isEnabled = result.enabled !== false;
    currentMode = result.mode || 'medium';
    log('Initialized', { isEnabled, currentMode, platform: currentPlatform, href: window.location.href });
    if (isEnabled && currentPlatform) {
        initObserver();
    }
});

// Message Listener
chrome.runtime.onMessage.addListener((message) => {
    if (message.type === 'TOGGLE_EXTENSION') {
        isEnabled = message.payload;
        log('Extension Toggled:', isEnabled);
        if (isEnabled) initObserver();
    } else if (message.type === 'UPDATE_MODE') {
        currentMode = message.payload;
        log('Mode Updated:', currentMode);
    }
});

function initObserver() {
    // Initial scan
    scanPage();

    // Observe DB changes
    const observer = new MutationObserver((mutations) => {
        if (!isEnabled) return;
        // Throttled scan or scan on significant mutations
        // checks if any nodes were added
        const hasAddedNodes = mutations.some(m => m.addedNodes.length > 0);
        if (hasAddedNodes) {
            scanPage();
        }
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
}

function scanPage() {
    if (!currentPlatform) return;

    const elements = document.querySelectorAll(currentPlatform.selector);
    if (elements.length > 0) {
        // log(`Found ${elements.length} potential elements`);
    }

    elements.forEach(el => {
        if (processedNodes.has(el)) return;

        // Skip empty or tiny text
        const text = el.innerText.trim();
        if (text.length < 3) return;

        processedNodes.add(el);
        queueAnalysis(el, text);
    });
}

function queueAnalysis(element, text) {
    analysisQueue.push({ element, text });
    processQueue();
}

async function processQueue() {
    if (isProcessingQueue || analysisQueue.length === 0) return;
    isProcessingQueue = true;

    // Take a batch
    const batch = analysisQueue.splice(0, BATCH_SIZE);

    for (const item of batch) {
        try {
            chrome.runtime.sendMessage({
                type: 'ANALYZE_TEXT',
                payload: item.text
            }, (response) => {
                if (chrome.runtime.lastError) {
                    log('Runtime error:', chrome.runtime.lastError);
                    return;
                }

                if (response && response.success) {
                    applyFilter(item.element, response.score);
                } else if (response && response.error) {
                    log('Analysis Error:', response.error);
                }
            });
        } catch (e) {
            console.error("Pacifiers: Analysis failed", e);
        }
    }

    // Schedule next batch
    setTimeout(() => {
        isProcessingQueue = false;
        processQueue();
    }, BATCH_DELAY);
}

function applyFilter(element, score) {
    let threshold = 1.0;

    // Light: > 0.9
    // Medium: > 0.7
    // Strong: > 0.5

    switch (currentMode) {
        case 'light': threshold = 0.9; break;
        case 'medium': threshold = 0.7; break;
        case 'strong': threshold = 0.5; break;
    }

    log(`Analyzed: "${element.innerText.substring(0, 20)}..." Score: ${score}, Threshold: ${threshold}`);

    if (score >= threshold) {
        log(`Blocking content (Score: ${score})`);
        blurElement(element);
        // Increment stats
        chrome.runtime.sendMessage({ type: 'INCREMENT_STATS' });
    }
}

function blurElement(element) {
    // Add class
    element.classList.add('pacifiers-blur');
    element.setAttribute('title', 'Click to reveal hidden content');

    // Add click listener
    element.addEventListener('click', function reveal(e) {
        e.preventDefault();
        e.stopPropagation();
        element.classList.remove('pacifiers-blur');
        element.classList.add('pacifiers-revealed');
        element.removeEventListener('click', reveal);
    }, { once: true });
}
