# 🛡️ Pacifiers - Hate Speech Blocker

**Pacifiers** is an advanced browser extension designed to create a safer, more positive online experience. Using Google's Perspective API, it automatically detects and blurs hate speech, toxicity, and harassment in real-time across social media platforms.

![Preview](asset/extension_image.png)

## 🌟 Features

*   **Real-time Detection**: Instantly analyzes comments on **YouTube**, **Reddit**, **Twitter/X**, and **Instagram**.
*   **Smart Privacy**: Runs locally in your browser. Only text content is sent to the API for analysis.
*   **3 Protection Modes**:
    *   🌤️ **Light**: Filters only extreme threats and severe toxicity.
    *   ⛅ **Medium** (Default): Blocks insults, harassment, and toxicity.
    *   ⛈️ **Strong**: Strict filtering of all negative or controversial content.
*   **Click-to-Reveal**: Found something blocked? Hover to check, and click to reveal if you really want to see it.
*   **Live Dashboard**: Track how many toxic comments have been blocked today.

![UI Preview](asset/extension_image.png)

---

## 🚀 Installation Guide

### 1. Load the Extension
Since this is a developer version, you will load it manually:
1.  Download or Clone this repository.
2.  Open your browser (Chrome, Edge, Brave).
3.  Navigate to `chrome://extensions`.
4.  Toggle **Developer Mode** on (usually in the top right corner).
5.  Click **Load unpacked**.
6.  Select the `Pacifiers` folder from your computer.

> **Important**: To use the local `test_bench.html`, locate the Pacifiers extension in the list, click **Details**, and toggle **"Allow access to file URLs"** to ON.

### 2. Get Your FREE API Key
Pacifiers requires a key to access Google's AI models. It's free and easy to get!

1.  **Request Access**: Go to [PerspectiveAPI.com](http://perspectiveapi.com/) and click "Request API Access". Fill out the short form (instant approval usually).
2.  **Google Cloud Console**:
    *   Go to the [Google Cloud Console](https://console.cloud.google.com/).
    *   Create a **New Project** (name it "Pacifiers").
3.  **Enable API**:
    *   Go to **APIs & Services** > **Library**.
    *   Search for **"Perspective Comment Analyzer API"**.
    *   Click **Enable**.
4.  **Create Key**:
    *   Go to **APIs & Services** > **Credentials**.
    *   Click **+ CREATE CREDENTIALS** > **API Key**.
    *   Copy the key (starts with `AIza...`).

### 3. Setup in Extension
1.  Click the **Pacifiers Shield Icon** in your browser toolbar.
2.  Paste your API Key into the **"API Settings"** input box.
3.  Click **Save**. You should see "Key saved"!

---

## 🧪 Testing

We have included a verified "Test Bench" to simulate toxic content safely.

1.  Open the file `test_bench.html` included in this folder with your browser.
2.  You will see simulated Social Media posts.
3.  If configured correctly, the toxic ones will typically look like this:

![Test Bench Blur](asset/example_website_image_with_extension_on.png)

## 📸 Gallery

Here is the extension in action:

**Extension Popup:**
![Extension Popup](asset/extension_image.png)

**Live Blurring Example:**
![Website with Blur](asset/example_website_image_with_extension_on.png)

**Hidden Comment on YouTube:**
![YouTube Hidden](asset/youtube_comment_hidden.png)


---

## 🛠️ Development Info

**Tech Stack**:
*   Manifest V3
*   Vanilla JavaScript (No framework bloat)
*   CSS3 Variables & Glassmorphism
*   Perspective API

**Structure**:
*   `manifest.json`: Configuration.
*   `background/`: Service worker for handling API requests securely.
*   `content/`: DOM observers that scan pages for text.
*   `popup/`: The sleek user interface.

---

*Project completed for Hackathon 2025.*
