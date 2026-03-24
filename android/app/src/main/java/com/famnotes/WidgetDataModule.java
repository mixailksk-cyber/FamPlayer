package com.famnotes;

import android.appwidget.AppWidgetManager;
import android.content.ComponentName;
import android.content.Context;
import android.content.SharedPreferences;
import android.widget.RemoteViews;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.Promise;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

public class WidgetDataModule extends ReactContextBaseJavaModule {
    private static ReactApplicationContext reactContext;
    private static final String SHARED_PREFS_NAME = "FamNotesWidgetPrefs";
    private static final String KEY_WIDGET_NOTES = "widget_notes";

    public WidgetDataModule(ReactApplicationContext context) {
        super(context);
        reactContext = context;
    }

    @Override
    public String getName() {
        return "WidgetDataModule";
    }

    @ReactMethod
    public void updateWidgetNotes(String notesJson) {
        try {
            SharedPreferences prefs = reactContext.getSharedPreferences(SHARED_PREFS_NAME, Context.MODE_PRIVATE);
            prefs.edit().putString(KEY_WIDGET_NOTES, notesJson).apply();

            Context context = reactContext;
            AppWidgetManager appWidgetManager = AppWidgetManager.getInstance(context);
            ComponentName componentName = new ComponentName(context, FamNotesWidgetProvider.class);
            int[] appWidgetIds = appWidgetManager.getAppWidgetIds(componentName);

            JSONArray notesArray = new JSONArray(notesJson);
            
            for (int appWidgetId : appWidgetIds) {
                RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.widget_layout);
                
                StringBuilder notesText = new StringBuilder();
                for (int i = 0; i < Math.min(notesArray.length(), 5); i++) {
                    JSONObject note = notesArray.getJSONObject(i);
                    String title = note.optString("title", "Без названия");
                    String content = note.optString("content", "...");
                    notesText.append("• ").append(title).append("\n");
                    if (content.length() > 30) {
                        notesText.append("  ").append(content.substring(0, 30)).append("...\n");
                    } else {
                        notesText.append("  ").append(content).append("\n");
                    }
                }
                
                if (notesArray.length() == 0) {
                    notesText.append("Нет заметок");
                } else if (notesArray.length() > 5) {
                    notesText.append("\n+ еще ").append(notesArray.length() - 5).append(" заметок");
                }
                
                views.setTextViewText(R.id.widget_notes_list, notesText.toString());
                views.setTextViewText(R.id.widget_notes_count, String.valueOf(notesArray.length()));
                
                appWidgetManager.updateAppWidget(appWidgetId, views);
            }
        } catch (JSONException e) {
            e.printStackTrace();
        }
    }

    @ReactMethod
    public void getWidgetNotes(Promise promise) {
        SharedPreferences prefs = reactContext.getSharedPreferences(SHARED_PREFS_NAME, Context.MODE_PRIVATE);
        String notesJson = prefs.getString(KEY_WIDGET_NOTES, "[]");
        promise.resolve(notesJson);
    }
}
