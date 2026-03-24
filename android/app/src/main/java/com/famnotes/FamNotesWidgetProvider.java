package com.famnotes;

import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.Context;
import android.content.SharedPreferences;
import android.widget.RemoteViews;

import org.json.JSONArray;
import org.json.JSONException;

public class FamNotesWidgetProvider extends AppWidgetProvider {

    private static final String SHARED_PREFS_NAME = "FamNotesWidgetPrefs";
    private static final String KEY_WIDGET_NOTES = "widget_notes";

    @Override
    public void onUpdate(Context context, AppWidgetManager appWidgetManager, int[] appWidgetIds) {
        SharedPreferences prefs = context.getSharedPreferences(SHARED_PREFS_NAME, Context.MODE_PRIVATE);
        String notesJson = prefs.getString(KEY_WIDGET_NOTES, "[]");
        
        for (int appWidgetId : appWidgetIds) {
            RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.widget_layout);
            
            try {
                JSONArray notesArray = new JSONArray(notesJson);
                StringBuilder notesText = new StringBuilder();
                
                if (notesArray.length() == 0) {
                    notesText.append("Нет заметок\n\nНажмите + чтобы создать");
                } else {
                    for (int i = 0; i < Math.min(notesArray.length(), 5); i++) {
                        String title = notesArray.getJSONObject(i).optString("title", "Без названия");
                        notesText.append("• ").append(title).append("\n");
                    }
                    if (notesArray.length() > 5) {
                        notesText.append("\n+ еще ").append(notesArray.length() - 5);
                    }
                }
                
                views.setTextViewText(R.id.widget_notes_list, notesText.toString());
                views.setTextViewText(R.id.widget_notes_count, String.valueOf(notesArray.length()));
                
            } catch (JSONException e) {
                views.setTextViewText(R.id.widget_notes_list, "Ошибка загрузки");
                views.setTextViewText(R.id.widget_notes_count, "0");
            }
            
            appWidgetManager.updateAppWidget(appWidgetId, views);
        }
    }
}
