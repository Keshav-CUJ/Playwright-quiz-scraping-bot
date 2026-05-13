# Un****y quiz scraping Bot

A high-reliability automation script built with **Playwright** to systematically capture practice questions and solutions from the Un****y platform.

## Overview

This bot automates the "Practice" section of Un****y. It navigates through specific subjects, selects topics, sets question counts, and captures screenshots of both the questions and their detailed solutions.

### Key Features

* **Persistent Session:** Uses your actual Chrome profile to bypass login/OTP walls.
* **MUI Drawer Handling:** Custom logic to scroll and interact with Material UI drawer components.
* **Sticky UI Cleaning:** Automatically hides headers and footers during capture to ensure clean screenshots.
* **State Reset:** Built-in "Reset" functions to clear checkboxes and refresh page states between topics.
* **Anti-Lazy Loading:** Includes strategic timeouts and "forced" interactions to ensure React components render fully before capturing.

---

## 🛠 Prerequisites

1. **Node.js:** Installed on your system.
2. **Playwright:** `npm install playwright`
3. **Chrome Browser:** The script is configured to use the local installation of Google Chrome.

---

## Configuration

Before running, update the following in `fullPlay.js`:

* **`userDataDir`**: Path to your Chrome User Data (usually `C:\Users\<YourUser>\AppData\Local\Google\Chrome\User Data\Profile 1`).
* **`executablePath`**: Path to your `chrome.exe`.
* **`CONFIG.selectors.noOfTopics`**: Number of topics you want to scrape.

---

## Folder Structure

The bot automatically organizes captures into the following hierarchy:

```text
/Aptitude (Subject Name)
  /Topic Name
    /question
      1.png
      2.png
    /answer
      1.png
      2.png

```

---

## How It Works (The Logic)

1. **Topic Mapping:** Scans the sidebar drawer to identify topic names, question counts, and internal checkbox values.
2. **Clean State:** Clears the "Select All" master checkbox to ensure only the target topic is processed.
3. **Pagination:** Clicks the `+` button until the desired number of questions (up to 30) is set for the session.
4. **Bypass Logic:** It captures the question, clicks **Skip**, then clicks **"Didn't understand"** to force the platform to reveal the detailed step-by-step solution.
5. **Clean Screenshots:** Uses `page.addStyleTag` to inject CSS that hides the sticky Header and Footer containers, preventing them from overlapping the text.
6. **Navigation:** Clicks "Next" or "Finish" and "Done" to loop through the set, eventually returning to the dashboard for the next topic.

---

## Troubleshooting

* **Drawer not clicking:** The script uses `drawer.scrollTo` via `page.evaluate` because standard Playwright scrolls don't always trigger internal division scrollbars.
* **Intercepted Clicks:** If a checkbox is blocked, the script uses `{ force: true }` to bypass the pointer-interception check.
* **Blank Solutions:** If solutions appear blank, the `await page.waitForTimeout(2000)` is crucial to allow the MathJax/LaTeX engine to render the formulas.

