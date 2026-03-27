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
            
            // Настройка открытия приложения при нажатии на пустую область виджета
            Intent openAppIntent = new Intent(context, MainActivity.class);
            openAppIntent.setAction(Intent.ACTION_MAIN);
            openAppIntent.addCategory(Intent.CATEGORY_LAUNCHER);
            openAppIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
            openAppIntent.setData(Uri.parse("famnotes://widget"));
            
            PendingIntent pendingIntent = PendingIntent.getActivity(
                context, 
                appWidgetId, 
                openAppIntent, 
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
            );
            views.setOnClickPendingIntent(R.id.widget_container, pendingIntent);
            
            appWidgetManager.updateAppWidget(appWidgetId, views);
        }
        super.onUpdate(context, appWidgetManager, appWidgetIds);
    }
    
    @Override
    public void onEnabled(Context context) {
        super.onEnabled(context);
    }
    
    @Override
    public void onDisabled(Context context) {
        super.onDisabled(context);
    }
    
    @Override
    public void onReceive(Context context, Intent intent) {
        super.onReceive(context, intent);
        // Принудительное обновление при получении BOOT_COMPLETED
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
