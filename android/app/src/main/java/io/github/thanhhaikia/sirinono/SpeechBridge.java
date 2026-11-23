package io.github.thanhhaikia.sirinono;

import android.Manifest;
import android.app.Activity;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.os.Bundle;
import android.speech.RecognitionListener;
import android.speech.RecognizerIntent;
import android.speech.SpeechRecognizer;
import android.speech.tts.TextToSpeech;
import android.speech.tts.UtteranceProgressListener;
import android.webkit.JavascriptInterface;
import android.webkit.WebView;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.util.ArrayList;
import java.util.Locale;

/**
 * Speech for the web app. Android's WebView has no Web Speech API, so js/speech.js calls this bridge instead.
 * Every call carries an id and is answered exactly once through window.__sirinonoNative(id, result).
 */
final class SpeechBridge {
    private static final int MIC_REQUEST = 1;
    private static final int NONE = -1;

    private final Activity activity;
    private final WebView web;

    private TextToSpeech tts;
    private boolean ttsReady;
    private Runnable speakWhenReady;
    private int speakId = NONE;

    private SpeechRecognizer recognizer;
    private int listenId = NONE;
    private String listenLang;
    private boolean askingForMic;

    SpeechBridge(Activity activity, WebView web) {
        this.activity = activity;
        this.web = web;
    }

    @JavascriptInterface
    public boolean canRecognize() {
        return SpeechRecognizer.isRecognitionAvailable(activity);
    }

    @JavascriptInterface
    public void speak(final int id, final String text, final String lang, final double rate) {
        activity.runOnUiThread(() -> startSpeaking(id, text, lang, (float) rate));
    }

    @JavascriptInterface
    public void stopSpeaking() {
        activity.runOnUiThread(this::cancelSpeaking);
    }

    @JavascriptInterface
    public void listen(final int id, final String lang) {
        activity.runOnUiThread(() -> requestListening(id, lang));
    }

    @JavascriptInterface
    public void stopListening() {
        activity.runOnUiThread(() -> {
            if (recognizer != null && listenId != NONE) recognizer.stopListening();
        });
    }

    // ---- text to speech ----

    private void startSpeaking(int id, String text, String lang, float rate) {
        cancelSpeaking();
        speakId = id;
        Runnable start = () -> {
            tts.setLanguage(Locale.forLanguageTag(lang));
            tts.setSpeechRate(rate);
            if (tts.speak(text, TextToSpeech.QUEUE_FLUSH, null, String.valueOf(id)) != TextToSpeech.SUCCESS) finishSpeaking(id, false);
        };
        if (ttsReady) {
            start.run();
            return;
        }
        speakWhenReady = start;
        if (tts == null) tts = new TextToSpeech(activity, this::onTtsInit);
    }

    private void onTtsInit(int status) {
        if (status != TextToSpeech.SUCCESS) {
            tts.shutdown();
            tts = null;
            speakWhenReady = null;
            finishSpeaking(speakId, false);
            return;
        }
        ttsReady = true;
        tts.setOnUtteranceProgressListener(new UtteranceProgressListener() {
            @Override public void onStart(String utteranceId) { }
            @Override public void onDone(String utteranceId) { ended(utteranceId, true); }
            @Override public void onError(String utteranceId) { ended(utteranceId, false); }
            @Override public void onStop(String utteranceId, boolean interrupted) { ended(utteranceId, false); }
            private void ended(String utteranceId, boolean ok) {
                activity.runOnUiThread(() -> finishSpeaking(Integer.parseInt(utteranceId), ok));
            }
        });
        Runnable start = speakWhenReady;
        speakWhenReady = null;
        if (start != null) start.run();
    }

    private void cancelSpeaking() {
        speakWhenReady = null;
        if (ttsReady) tts.stop();
        finishSpeaking(speakId, false);
    }

    private void finishSpeaking(int id, boolean ok) {
        if (id == NONE || id != speakId) return;
        speakId = NONE;
        try {
            reply(id, new JSONObject().put("ok", ok));
        } catch (JSONException ignored) {
            // a boolean value cannot fail to serialise
        }
    }

    // ---- speech recognition ----

    private void requestListening(int id, String lang) {
        if (listenId != NONE) {
            replyError(id, "aborted");
            return;
        }
        listenId = id;
        listenLang = lang;
        if (activity.checkSelfPermission(Manifest.permission.RECORD_AUDIO) == PackageManager.PERMISSION_GRANTED) startListening();
        else {
            askingForMic = true;
            activity.requestPermissions(new String[] { Manifest.permission.RECORD_AUDIO }, MIC_REQUEST);
        }
    }

    void onPermissionResult(int requestCode, int[] grantResults) {
        if (requestCode != MIC_REQUEST) return;
        askingForMic = false;
        if (listenId == NONE) return;
        if (grantResults.length > 0 && grantResults[0] == PackageManager.PERMISSION_GRANTED) startListening();
        else finishListening(null, "not-allowed");
    }

    private void startListening() {
        if (!SpeechRecognizer.isRecognitionAvailable(activity)) {
            finishListening(null, "unsupported");
            return;
        }
        if (recognizer == null) {
            recognizer = SpeechRecognizer.createSpeechRecognizer(activity);
            recognizer.setRecognitionListener(new Listener());
        }
        Intent intent = new Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH)
                .putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM)
                .putExtra(RecognizerIntent.EXTRA_LANGUAGE, listenLang)
                .putExtra(RecognizerIntent.EXTRA_LANGUAGE_PREFERENCE, listenLang)
                .putExtra(RecognizerIntent.EXTRA_MAX_RESULTS, 5)
                .putExtra(RecognizerIntent.EXTRA_CALLING_PACKAGE, activity.getPackageName());
        recognizer.startListening(intent);
    }

    private void finishListening(JSONArray alternatives, String error) {
        int id = listenId;
        if (id == NONE) return;
        listenId = NONE;
        if (alternatives == null) {
            replyError(id, error);
            return;
        }
        try {
            reply(id, new JSONObject().put("alternatives", alternatives));
        } catch (JSONException e) {
            replyError(id, "unknown");
        }
    }

    private final class Listener implements RecognitionListener {
        @Override
        public void onResults(Bundle results) {
            ArrayList<String> texts = results.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION);
            float[] scores = results.getFloatArray(SpeechRecognizer.CONFIDENCE_SCORES);
            JSONArray alternatives = new JSONArray();
            try {
                for (int i = 0; texts != null && i < texts.size(); i++) {
                    double confidence = scores != null && i < scores.length && scores[i] >= 0 ? scores[i] : 0;
                    alternatives.put(new JSONObject().put("transcript", texts.get(i)).put("confidence", confidence));
                }
            } catch (JSONException e) {
                alternatives = new JSONArray();
            }
            if (alternatives.length() > 0) finishListening(alternatives, null);
            else finishListening(null, "no-speech");
        }

        @Override
        public void onError(int error) {
            finishListening(null, errorCode(error));
        }

        @Override public void onReadyForSpeech(Bundle params) { }
        @Override public void onBeginningOfSpeech() { }
        @Override public void onRmsChanged(float rmsdB) { }
        @Override public void onBufferReceived(byte[] buffer) { }
        @Override public void onEndOfSpeech() { }
        @Override public void onPartialResults(Bundle partialResults) { }
        @Override public void onEvent(int eventType, Bundle params) { }
    }

    /** Maps Android recognizer errors to the Web Speech API error names the web app already understands. */
    private static String errorCode(int error) {
        switch (error) {
            case SpeechRecognizer.ERROR_NO_MATCH:
            case SpeechRecognizer.ERROR_SPEECH_TIMEOUT:
                return "no-speech";
            case SpeechRecognizer.ERROR_NETWORK:
            case SpeechRecognizer.ERROR_NETWORK_TIMEOUT:
            case SpeechRecognizer.ERROR_SERVER:
                return "network";
            case SpeechRecognizer.ERROR_INSUFFICIENT_PERMISSIONS:
                return "not-allowed";
            case SpeechRecognizer.ERROR_AUDIO:
                return "audio-capture";
            case SpeechRecognizer.ERROR_CLIENT:
            case SpeechRecognizer.ERROR_RECOGNIZER_BUSY:
                return "aborted";
            default:
                return "service-not-allowed";
        }
    }

    // ---- lifecycle ----

    void pause() {
        cancelSpeaking();
        // The permission dialog pauses the activity; that request must survive until it is answered.
        if (listenId != NONE && !askingForMic) {
            if (recognizer != null) recognizer.cancel();
            finishListening(null, "aborted");
        }
    }

    void destroy() {
        if (recognizer != null) recognizer.destroy();
        if (tts != null) tts.shutdown();
    }

    private void replyError(int id, String code) {
        try {
            reply(id, new JSONObject().put("error", code));
        } catch (JSONException ignored) {
            // a string value cannot fail to serialise
        }
    }

    private void reply(int id, JSONObject result) {
        web.evaluateJavascript("window.__sirinonoNative && window.__sirinonoNative(" + id + "," + result + ")", null);
    }
}
