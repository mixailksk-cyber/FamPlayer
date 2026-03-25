package com.famnotes;

import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.net.Uri;
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
            
            // Открытие приложения при нажатии на виджет
            Intent intent = new Intent(context, MainActivity.class);
            intent.setAction(Intent.ACTION_MAIN);
            intent.addCategory(Intent.CATEGORY_LAUNCHER);
            intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
            intent.setData(Uri.parse("famnotes://widget"));
            
            android.app.PendingIntent pendingIntent = android.app.PendingIntent.getActivity(
                context, 
                appWidgetId, 
                intent, 
                android.app.PendingIntent.FLAG_UPDATE_CURRENT | android.app.PendingIntent.FLAG_IMMUTABLE
            );
            views.setOnClickPendingIntent(R.id.widget_container, pendingIntent);
            
            try {
                JSONArray notesArray = new JSONArray(notesJson);
                StringBuilder notesText = new StringBuilder();
                
                if (notesArray.length() == 0) {
                    notesText.append("Нет заметок в папке Главная\n\nНажмите + чтобы создать");
                } else {
                    // Показываем все заметки из папки Главная
                    for (int i = 0; i < notesArray.length(); i++) {
                        String title = notesArray.getJSONObject(i).optString("title", "Без названия");
                        notesText.append("• ").append(title).append("\n");
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
