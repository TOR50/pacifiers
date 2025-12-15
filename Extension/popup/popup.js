document.addEventListener('DOMContentLoaded', () => {
    // UI Elements
    const toggle = document.getElementById('extensionToggle');
    const statusText = document.getElementById('statusIndicator');
    const modeOptions = document.querySelectorAll('.mode-option');
    const modeDesc = document.getElementById('modeDescription');
    const apiKeyInput = document.getElementById('apiKeyInput');
    const saveKeyBtn = document.getElementById('saveKeyBtn');
    const apiStatus = document.getElementById('apiStatus');
    const blockedCount = document.getElementById('blockedCount');

    // Mode Descriptions
    const MODE_DESCRIPTIONS = {
        light: "ONLY blurs extreme toxicity/severe threats.",
        medium: "Blurs insults and harassment. (Recommended)",
        strong: "Blurs all detected negativity or controversial content."
    };

    // Load Saved State
    chrome.storage.sync.get(['enabled', 'mode', 'apiKey', 'stats'], (result) => {
        // Toggle State
        toggle.checked = result.enabled !== false; // Default true
        updateStatus(toggle.checked);

        // Mode State
        const currentMode = result.mode || 'medium';
        selectMode(currentMode);

        // API Key
        if (result.apiKey) {
            apiKeyInput.value = result.apiKey;
            apiStatus.textContent = "Key saved";
            apiStatus.style.color = "var(--success)";
        }

        // Stats
        if (result.stats && result.stats.blockedToday) {
            blockedCount.textContent = result.stats.blockedToday;
        }
    });

    // Event Listeners
    toggle.addEventListener('change', () => {
        const enabled = toggle.checked;
        chrome.storage.sync.set({ enabled: enabled });
        updateStatus(enabled);

        // Notify content scripts/background
        chrome.runtime.sendMessage({ type: 'TOGGLE_EXTENSION', payload: enabled });
    });

    modeOptions.forEach(option => {
        option.addEventListener('click', () => {
            const mode = option.dataset.mode;
            selectMode(mode);
            chrome.storage.sync.set({ mode: mode });

            // Notify content scripts/background
            chrome.runtime.sendMessage({ type: 'UPDATE_MODE', payload: mode });
        });
    });

    saveKeyBtn.addEventListener('click', () => {
        const key = apiKeyInput.value.trim();
        if (key) {
            chrome.storage.sync.set({ apiKey: key }, () => {
                apiStatus.textContent = "Key saved successfully!";
                apiStatus.style.color = "var(--success)";
                setTimeout(() => {
                    apiStatus.textContent = "Key saved";
                }, 2000);
            });
        }
    });

    // Helper Functions
    function updateStatus(enabled) {
        if (enabled) {
            statusText.textContent = "Active";
            statusText.className = "active";
            statusText.style.color = "var(--success)";
        } else {
            statusText.textContent = "Inactive";
            statusText.className = "inactive";
            statusText.style.color = "var(--text-muted)";
        }
    }

    function selectMode(mode) {
        modeOptions.forEach(opt => opt.classList.remove('selected'));
        const selectedOption = document.querySelector(`.mode-option[data-mode="${mode}"]`);
        if (selectedOption) selectedOption.classList.add('selected');

        modeDesc.textContent = MODE_DESCRIPTIONS[mode];
    }

    // Listen for stats updates
    chrome.runtime.onMessage.addListener((message) => {
        if (message.type === 'STATS_UPDATED') {
            blockedCount.textContent = message.payload.blockedToday;
        }
    });
});
