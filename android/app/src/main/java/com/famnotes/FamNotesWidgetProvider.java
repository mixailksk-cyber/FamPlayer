package com.famnotes;

import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.net.Uri;
import android.text.Html;
import android.text.TextUtils;
import android.widget.RemoteViews;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

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
                
            } catch (JSONException e) {
                views.setTextViewText(R.id.widget_notes_list, "Ошибка загрузки");
            }
            
            appWidgetManager.updateAppWidget(appWidgetId, views);
        }
    }
}
