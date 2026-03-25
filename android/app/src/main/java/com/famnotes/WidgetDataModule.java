package com.famnotes;

import android.appwidget.AppWidgetManager;
import android.content.ComponentName;
import android.content.Context;
import android.content.SharedPreferences;
import android.text.Html;
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
                            
                            // Заголовок 18sp bold, текст 16sp
                            if (!TextUtils.isEmpty(title) && !TextUtils.isEmpty(content)) {
                                String shortContent = content.length() > 40 ? content.substring(0, 40) + "..." : content;
                                notesText.append("<b><font size='18'>").append(title).append("</font></b><br/>");
                                notesText.append("<font size='16'>").append(shortContent).append("</font>");
                            } else if (!TextUtils.isEmpty(title)) {
                                notesText.append("<b><font size='18'>").append(title).append("</font></b>");
                            } else if (!TextUtils.isEmpty(content)) {
                                String shortContent = content.length() > 45 ? content.substring(0, 45) + "..." : content;
                                notesText.append("<font size='16'>").append(shortContent).append("</font>");
                            } else {
                                notesText.append("<font size='16'>Без названия</font>");
                            }
                            
                            // Добавляем разделитель (кроме последней заметки) - уменьшенный отступ
                            if (i < notesArray.length() - 1) {
                                notesText.append("<br/><br/><hr color='#33FFFFFF'/><br/>");
                            }
                        }
                    }
                    
                    // Используем Html.fromHtml для форматирования
                    if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.N) {
                        views.setTextViewText(R.id.widget_notes_list, Html.fromHtml(notesText.toString(), Html.FROM_HTML_MODE_LEGACY));
                    } else {
                        views.setTextViewText(R.id.widget_notes_list, Html.fromHtml(notesText.toString()));
                    }
                    
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
