# Sirinono

Sirinono is an English pronunciation and speaking app for Vietnamese students aged 11–15. It is a static website: HTML, CSS and plain JavaScript, with no build step and no server. All content and code were written for this project.

## Features

- **Topic lessons (8 topics):** School Life, Hobbies & Games, Sports & Health, Food & Drinks, Travel & Places, Tech & Social Media, Friends & Feelings, Dreams & Future. Each topic has 10 words (with IPA and Vietnamese meaning) and 6 sentences.
- **Speaking practice:**
  - Listen to the model voice at normal or slow speed, then press 🎤 and read it aloud.
  - Get a score from 0 to 100 and up to 3 stars.
  - Each word is coloured green (heard clearly), yellow (close) or red (not heard).
  - Get Vietnamese tips for the hard sounds (th, sh, r/l, final sounds, consonant clusters…).
  - Play back your own recording.
- **Sound Lab (8 sound groups):** th, s/sh, long and short i, /æ/ and /e/, r/l, final sounds, v/w, z/s. Each group has:
  - instructions for tongue and lip position,
  - minimal pairs,
  - speaking practice,
  - a "Listen and choose" game.
- **Role-play (6 scenes):** meeting a new classmate, ordering a drink, asking for directions, gaming with a friend, talking about the weekend, buying sneakers. The character speaks, then the student picks a suggested reply and says it.
- **Motivation:** XP, 10 levels, day streaks, a daily goal, a daily challenge (6 items, +25 XP) and 13 badges.
- **PWA:** can be installed on a phone's home screen. After the first visit, the interface works offline.

## Limitations

- Scores are based on the words the browser's speech recognition **heard**. They are not a per-phoneme grade like ELSA's.
- Speech recognition works on Chrome/Edge (Android and computers) and Safari (iOS 14.5+). It needs Internet access and microphone permission. Firefox does not support it; there the student can still listen to the model voice and type to test scoring.
- The model voice uses the device's built-in English voices, so it sounds different on each device.
- Progress is stored only in the browser on that device (localStorage).

## Run locally

```bash
npm start     # http://localhost:8080
npm test      # unit tests (node:test, no dependencies)
```

The microphone works on `localhost` or over HTTPS.

## Deploy

The `.github/workflows/pages.yml` workflow runs the tests and deploys to GitHub Pages when code is pushed to `main`. To enable it, go to **Settings → Pages → Source: GitHub Actions**.

## Structure

```
index.html          interface shell, bottom navigation
css/style.css       mobile-first styles
js/app.js           router and screens (home, lessons, practice, Sound Lab, role-play, profile)
js/speech.js        text-to-speech, speech recognition, recording
js/scoring.js       word alignment, scoring, Vietnamese pronunciation tips
js/progress.js      XP, levels, streaks, badges, daily challenge
js/data.js          lesson content
manifest.json, sw.js, icons/   PWA
tests/              unit tests
```
