package com.famnotes;

import android.appwidget.AppWidgetManager;
import android.content.ComponentName;
import android.content.Context;
import android.content.SharedPreferences;
import android.text.TextUtils;
import android.widget.RemoteViews;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.Promise;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

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
                        notesText.append("Нет заметок в папке Главная");
                    } else {
                        for (int i = 0; i < notesArray.length(); i++) {
                            JSONObject note = notesArray.getJSONObject(i);
                            String title = note.optString("title", "");
                            String content = note.optString("content", "");
                            
                            // Формируем строку заметки
                            if (!TextUtils.isEmpty(title) && !TextUtils.isEmpty(content)) {
                                // Обрезаем контент до одной строки (примерно 40 символов)
                                String shortContent = content.length() > 40 ? content.substring(0, 40) + "..." : content;
                                notesText.append("• ").append(title).append("\n  ").append(shortContent).append("\n");
                            } else if (!TextUtils.isEmpty(title)) {
                                notesText.append("• ").append(title).append("\n");
                            } else if (!TextUtils.isEmpty(content)) {
                                String shortContent = content.length() > 45 ? content.substring(0, 45) + "..." : content;
                                notesText.append("• ").append(shortContent).append("\n");
                            } else {
                                notesText.append("• Без названия\n");
                            }
                            
                            // Добавляем разделитель (кроме последней заметки)
                            if (i < notesArray.length() - 1) {
                                notesText.append("\n");
                            }
                        }
                    }
                    
                    views.setTextViewText(R.id.widget_notes_list, notesText.toString());
                    
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
