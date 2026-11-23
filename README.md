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
- **Review mistakes:** a list of the words and sentences whose latest attempt scored under 80, with what was heard and a tip.
- **Resume:** an unfinished lesson, quiz or role-play survives a reload or Back; lessons can be continued from Home.
- **PWA:** can be installed on a phone's home screen. After the first visit, the interface works offline; without Internet the student types answers instead of using the microphone.

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

## Android app (APK)

The `android/` folder wraps the same web app in a small native Android app (Java, no third-party libraries). The web files are copied into the APK at build time, so there is one source for both.

```bash
cd android
./gradlew assembleDebug     # app/build/outputs/apk/debug/app-debug.apk
```

Building needs JDK 17 and the Android SDK (platform 34); point `ANDROID_HOME` at the SDK or set `sdk.dir` in `android/local.properties`. The `.github/workflows/android.yml` workflow builds the same APK and stores it as the `sirinono-apk` artifact of each run.

How the APK differs from the website:

- Android's WebView has no Web Speech API, so `js/speech.js` talks to `SpeechBridge.java`, which uses Android's own speech recognizer and text-to-speech. Recognition needs the Google app (or another recognition service) on the device.
- The microphone permission is requested the first time 🎤 is pressed.
- Playing back your own recording is not available, because the recognizer holds the microphone while it listens.
- The app has no Internet permission. All files are inside the APK; only Android's speech recognizer goes online.
- Requires Android 7.0 or newer with Android System WebView 80 or newer; an older WebView gets a screen asking to update it.

The debug APK is signed with the build machine's debug key. An APK built on another machine has a different signature, and Android refuses to install it over the old one until the old app is removed (which deletes the saved progress). For updates that install over each other, create one keystore, keep it out of git, and describe it in `android/keystore.properties` (`storeFile`, `storePassword`, `keyAlias`, `keyPassword`); `./gradlew assembleRelease` then signs with it.

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
js/resume.js        remembers an unfinished lesson, quiz or role-play
js/data.js          lesson content
manifest.json, sw.js, icons/   PWA
android/            Android app: WebView shell and native speech bridge
tests/              unit tests
```
