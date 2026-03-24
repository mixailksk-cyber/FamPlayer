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

public class WidgetDataModule extends ReactContextBaseJavaModule {
    private static final String SHARED_PREFS_NAME = "FamNotesWidgetPrefs";
    private static final String KEY_WIDGET_NOTES = "widget_notes";
    private final ReactApplicationContext reactContext;

    public WidgetDataModule(ReactApplicationContext context) {
        super(context);
        this.reactContext = context;
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

            AppWidgetManager appWidgetManager = AppWidgetManager.getInstance(reactContext);
            ComponentName componentName = new ComponentName(reactContext, FamNotesWidgetProvider.class);
            int[] appWidgetIds = appWidgetManager.getAppWidgetIds(componentName);

            if (appWidgetIds.length > 0) {
                JSONArray notesArray = new JSONArray(notesJson);
                
                for (int appWidgetId : appWidgetIds) {
                    RemoteViews views = new RemoteViews(reactContext.getPackageName(), R.layout.widget_layout);
                    
                    StringBuilder notesText = new StringBuilder();
                    if (notesArray.length() == 0) {
                        notesText.append("Нет заметок");
                    } else {
                        for (int i = 0; i < notesArray.length(); i++) {
                            String title = notesArray.getJSONObject(i).optString("title", "");
                            String content = notesArray.getJSONObject(i).optString("content", "");
                            
                            if (!title.isEmpty()) {
                                notesText.append("• ").append(title);
                                if (!content.isEmpty()) {
                                    notesText.append("\n  ").append(content);
                                }
                            } else if (!content.isEmpty()) {
                                notesText.append("• ").append(content);
                            }
                            
                            // Разделитель между заметками
                            if (i < notesArray.length() - 1) {
                                notesText.append("\n");
                                notesText.append("─".repeat(20));
                                notesText.append("\n");
                            }
                        }
                    }
                    
                    views.setTextViewText(R.id.widget_notes_list, notesText.toString());
                    views.setTextViewText(R.id.widget_notes_count, String.valueOf(notesArray.length()));
                    
                    appWidgetManager.updateAppWidget(appWidgetId, views);
                }
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
