document.addEventListener("DOMContentLoaded", () => {
    const scrapeBtn = document.getElementById("scrapeBtn");
    const analyzeBtn = document.getElementById("analyzeBtn");
    const outputDiv = document.getElementById("output");
    const resultDiv = document.getElementById("analysisResult");

    const API_KEY = " its not here"; // 🔹 Replace with your actual API Key
    const API_URL = `https://commentanalyzer.googleapis.com/v1alpha1/comments:analyze?key=${API_KEY}`;

    scrapeBtn.addEventListener("click", () => {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs.length === 0) return;
            chrome.scripting.executeScript({
                target: { tabId: tabs[0].id },
                files: ["content.js"]
            }).catch((error) => console.error("Script injection failed:", error));
        });
    });

    chrome.runtime.onMessage.addListener((message) => {
        if (message.action === "scrapedData") {
            chrome.storage.local.set({ scrapedData: message.data });
            displayData(message.data);
        }
    });

    function displayData(data) {
        outputDiv.innerHTML = `<h3>Extracted YouTube Comments</h3>
                               <p><strong>Video Title:</strong> ${data.title}</p>
                               <p><strong>Video URL:</strong> <a href="${data.url}" target="_blank">${data.url}</a></p>
                               <pre>${data.comments}</pre>`;

        analyzeBtn.disabled = false;
        analyzeBtn.onclick = () => analyzeText(data.comments);
    }

    // ✅ FIXED: Improved API Call with Debugging
    async function analyzeText(comments) {
        console.log("🔹 Sending request to Perspective API...");

        const requestBody = {
            comment: { text: comments.substring(0, 3000) }, // 🔹 API limit is 3000 chars
            languages: ["en"],
            requestedAttributes: {
                TOXICITY: {},
                SEVERE_TOXICITY: {},
                INSULT: {},
                THREAT: {},
                PROFANITY: {}
            }
        };

        try {
            resultDiv.innerHTML = `<p>Analyzing comments... Please wait.</p>`;

            const response = await fetch(API_URL, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(requestBody)
            });

            // ✅ Log Response Details
            console.log("🔹 API Response Status:", response.status);
            const result = await response.json();
            console.log("🔹 API Response Data:", result);

            if (!response.ok) {
                throw new Error(`API Error: ${result.error.message || response.status}`);
            }

            displayAnalysis(result);
        } catch (error) {
            console.error("❌ API call failed:", error);
            resultDiv.innerHTML = `<p style="color: red;">Error: ${error.message}</p>`;
        }
    }

    function displayAnalysis(result) {
        const toxicity = result.attributeScores?.TOXICITY?.summaryScore?.value || 0;
        const severeToxicity = result.attributeScores?.SEVERE_TOXICITY?.summaryScore?.value || 0;
        const insult = result.attributeScores?.INSULT?.summaryScore?.value || 0;
        const threat = result.attributeScores?.THREAT?.summaryScore?.value || 0;
        const profanity = result.attributeScores?.PROFANITY?.summaryScore?.value || 0;

        resultDiv.innerHTML = `<h3>Perspective API Analysis</h3>
                               <p><strong>Toxicity:</strong> ${(toxicity * 100).toFixed(2)}%</p>
                               <p><strong>Severe Toxicity:</strong> ${(severeToxicity * 100).toFixed(2)}%</p>
                               <p><strong>Insult:</strong> ${(insult * 100).toFixed(2)}%</p>
                               <p><strong>Threat:</strong> ${(threat * 100).toFixed(2)}%</p>
                               <p><strong>Profanity:</strong> ${(profanity * 100).toFixed(2)}%</p>`;
    }
});
