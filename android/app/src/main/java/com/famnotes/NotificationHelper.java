package com.famnotes;

import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.content.Context;
import android.os.Build;

public class NotificationHelper {
    public static final String CHANNEL_ID = "famnotes_channel";
    public static final String CHANNEL_NAME = "FamNotes Reminders";
    public static final String CHANNEL_DESCRIPTION = "Notifications for note reminders";

    public static void createNotificationChannel(Context context) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(
                CHANNEL_ID,
                CHANNEL_NAME,
                NotificationManager.IMPORTANCE_HIGH
            );
            channel.setDescription(CHANNEL_DESCRIPTION);
            channel.enableLights(true);
            channel.enableVibration(true);
            // VISIBILITY_PUBLIC доступен начиная с API 23 (Android 6.0)
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                channel.setLockscreenVisibility(NotificationManager.VISIBILITY_PUBLIC);
            }
            
            NotificationManager manager = (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
            manager.createNotificationChannel(channel);
        }
    }
}
