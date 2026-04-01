package com.famplayer;

import android.appwidget.AppWidgetManager;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.net.Uri;
import android.widget.RemoteViews;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.Promise;

public class FamPlayerWidgetDataModule extends ReactContextBaseJavaModule {
    private static final String SHARED_PREFS_NAME = "FamPlayerWidgetPrefs";
    private static final String KEY_WIDGET_NOTES = "widget_notes";
    private final ReactApplicationContext reactContext;

    public FamPlayerWidgetDataModule(ReactApplicationContext context) {
        super(context);
        this.reactContext = context;
    }

    @Override
    public String getName() {
        return "FamPlayerWidgetDataModule";
    }

    @ReactMethod
    public void updateWidgetNotes(String notesJson) {
        try {
            SharedPreferences prefs = reactContext.getSharedPreferences(SHARED_PREFS_NAME, Context.MODE_PRIVATE);
            prefs.edit().putString(KEY_WIDGET_NOTES, notesJson).apply();

            // Обновляем данные в сервисе
            FamPlayerWidgetService.updateWidgetData(reactContext, notesJson);

            // Обновляем виджет
            AppWidgetManager appWidgetManager = AppWidgetManager.getInstance(reactContext);
            ComponentName componentName = new ComponentName(reactContext, FamPlayerWidgetProvider.class);
            int[] appWidgetIds = appWidgetManager.getAppWidgetIds(componentName);
            
            if (appWidgetIds.length > 0) {
                for (int appWidgetId : appWidgetIds) {
                    RemoteViews views = new RemoteViews(reactContext.getPackageName(), R.layout.widget_layout);
                    
                    // Настройка адаптера для ListView
                    Intent intent = new Intent(reactContext, FamPlayerWidgetService.class);
                    intent.putExtra(AppWidgetManager.EXTRA_APPWIDGET_ID, appWidgetId);
                    intent.setData(Uri.parse(intent.toUri(Intent.URI_INTENT_SCHEME)));
                    
                    views.setRemoteAdapter(R.id.widget_list, intent);
                    views.setEmptyView(R.id.widget_list, android.R.id.empty);
                    
                    // Настройка открытия приложения при нажатии на пустую область виджета
                    Intent openAppIntent = new Intent(reactContext, MainActivity.class);
                    openAppIntent.setAction(Intent.ACTION_MAIN);
                    openAppIntent.addCategory(Intent.CATEGORY_LAUNCHER);
                    openAppIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
                    
                    android.app.PendingIntent pendingIntent = android.app.PendingIntent.getActivity(
                        reactContext, 
                        appWidgetId, 
                        openAppIntent, 
                        android.app.PendingIntent.FLAG_UPDATE_CURRENT | android.app.PendingIntent.FLAG_IMMUTABLE
                    );
                    // Используем существующий ID из layout
                    views.setOnClickPendingIntent(R.id.widget_open_app_button, pendingIntent);
                    
                    appWidgetManager.updateAppWidget(appWidgetId, views);
                }
            }
        } catch (Exception e) {
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
