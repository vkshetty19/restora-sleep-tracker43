# Restora — Sleep Tracker

Restora is a responsive, privacy-friendly sleep tracking website built with HTML, CSS and vanilla JavaScript.

## Features

- Log, edit and delete sleep sessions.
- Calculate sleep duration, including sessions that cross midnight.
- View a 7-day or 30-day sleep-duration chart.
- See average sleep, nights tracked and estimated shortfall against a personal goal.
- Browse entries in a monthly calendar.
- Keep a daily sleep journal.
- Plan approximate bedtimes based on a chosen wake-up time, sleep goal and time to fall asleep.
- Export sleep logs as CSV.
- Back up and restore all app data as JSON.
- Switch between light and dark themes.
- Store information locally in the current browser using `localStorage`.

## Run locally

1. Download or clone this repository.
2. Open `index.html` in a modern browser.

For a local development server, you can also use the VS Code Live Server extension.

## Deploy with GitHub Pages

1. Push this folder to a GitHub repository.
2. Open **Settings → Pages**.
3. Under **Build and deployment**, choose **Deploy from a branch**.
4. Select `main` and `/ (root)`, then save.
5. Wait for the published URL to appear in the Pages section.



Restora does not require an account or a backend database. Entries are saved in the browser where the app is used. Clearing browser data can remove those entries, so use the JSON backup feature if you want a portable copy.

Sleep duration and shortfall are calculated from self-reported times. The bedtime planner is a simple scheduling aid; it does not measure REM sleep, sleep stages, alertness or physical recovery and should not be treated as medical advice.

Chart.js is loaded from jsDelivr, and the font is loaded from Google Fonts. Those visual assets require an internet connection. The rest of the app's core logging and calculations work locally.
