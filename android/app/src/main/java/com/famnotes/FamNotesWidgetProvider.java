package com.famnotes;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.widget.RemoteViews;

public class FamNotesWidgetProvider extends AppWidgetProvider {

    public static final String ACTION_CREATE_NOTE = "CREATE_NOTE";

    @Override
    public void onUpdate(Context context, AppWidgetManager appWidgetManager, int[] appWidgetIds) {
        for (int appWidgetId : appWidgetIds) {
            RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.widget_layout);
            
            // Настройка адаптера для ListView
            Intent intent = new Intent(context, FamNotesWidgetService.class);
            intent.putExtra(AppWidgetManager.EXTRA_APPWIDGET_ID, appWidgetId);
            intent.setData(Uri.parse(intent.toUri(Intent.URI_INTENT_SCHEME)));
            
            views.setRemoteAdapter(R.id.widget_list, intent);
            views.setEmptyView(R.id.widget_list, android.R.id.empty);
            
            // Настройка кнопки "Новая заметка"
            Intent createNoteIntent = new Intent(context, FamNotesWidgetProvider.class);
            createNoteIntent.setAction(ACTION_CREATE_NOTE);
            PendingIntent createPendingIntent = PendingIntent.getBroadcast(
                context,
                appWidgetId,
                createNoteIntent,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
            );
            views.setOnClickPendingIntent(R.id.widget_add_button, createPendingIntent);
            
            // Настройка кнопки "Все заметки"
            Intent openAppIntent = new Intent(context, MainActivity.class);
            openAppIntent.setAction(Intent.ACTION_MAIN);
            openAppIntent.addCategory(Intent.CATEGORY_LAUNCHER);
            openAppIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
            openAppIntent.setData(Uri.parse("famnotes://widget"));
            
            PendingIntent openPendingIntent = PendingIntent.getActivity(
                context, 
                appWidgetId, 
                openAppIntent, 
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
            );
            views.setOnClickPendingIntent(R.id.widget_open_app_button, openPendingIntent);
            
            appWidgetManager.updateAppWidget(appWidgetId, views);
        }
        super.onUpdate(context, appWidgetManager, appWidgetIds);
    }
    
    @Override
    public void onReceive(Context context, Intent intent) {
        super.onReceive(context, intent);
        
        // Обработка нажатия на кнопку создания заметки
        if (ACTION_CREATE_NOTE.equals(intent.getAction())) {
            Intent openAppIntent = new Intent(context, MainActivity.class);
            openAppIntent.setAction(Intent.ACTION_VIEW);
            openAppIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
            openAppIntent.setData(Uri.parse("famnotes://create"));
            openAppIntent.putExtra("create_new_note", true);
            context.startActivity(openAppIntent);
        }
        
        if (Intent.ACTION_BOOT_COMPLETED.equals(intent.getAction())) {
            AppWidgetManager appWidgetManager = AppWidgetManager.getInstance(context);
            ComponentName componentName = new ComponentName(context, FamNotesWidgetProvider.class);
            int[] appWidgetIds = appWidgetManager.getAppWidgetIds(componentName);
            if (appWidgetIds.length > 0) {
                onUpdate(context, appWidgetManager, appWidgetIds);
            }
        }
    }
}
