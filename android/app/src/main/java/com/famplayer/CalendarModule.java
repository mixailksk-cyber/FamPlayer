package com.famplayer;

import android.content.ContentResolver;
import android.content.ContentValues;
import android.content.Context;
import android.database.Cursor;
import android.net.Uri;
import android.provider.CalendarContract;
import android.content.pm.PackageManager;
import android.Manifest;
import android.os.Build;
import android.util.Log;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.bridge.Arguments;

import java.util.TimeZone;

public class CalendarModule extends ReactContextBaseJavaModule {
    private static final String MODULE_NAME = "CalendarModule";
    private static final String TAG = "CalendarModule";
    
    public CalendarModule(ReactApplicationContext reactContext) {
        super(reactContext);
    }

    @Override
    public String getName() {
        return MODULE_NAME;
    }

    @ReactMethod
    public void checkCalendarPermission(Promise promise) {
        Context context = getReactApplicationContext();
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            boolean hasReadPermission = context.checkSelfPermission(Manifest.permission.READ_CALENDAR) == PackageManager.PERMISSION_GRANTED;
            boolean hasWritePermission = context.checkSelfPermission(Manifest.permission.WRITE_CALENDAR) == PackageManager.PERMISSION_GRANTED;
            Log.d(TAG, "Calendar permissions - read: " + hasReadPermission + ", write: " + hasWritePermission);
            promise.resolve(hasReadPermission && hasWritePermission);
        } else {
            promise.resolve(true);
        }
    }

    @ReactMethod
    public void addEvent(String title, String description, double startTime, double endTime, Promise promise) {
        try {
            Context context = getReactApplicationContext();
            
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                if (context.checkSelfPermission(Manifest.permission.WRITE_CALENDAR) != PackageManager.PERMISSION_GRANTED) {
                    Log.e(TAG, "Write calendar permission denied");
                    promise.reject("PERMISSION_DENIED", "Calendar write permission not granted");
                    return;
                }
            }

            ContentResolver contentResolver = context.getContentResolver();
            ContentValues values = new ContentValues();
            
            long calendarId = getDefaultCalendarId(contentResolver);
            if (calendarId == -1) {
                Log.e(TAG, "No calendar found");
                promise.reject("NO_CALENDAR", "No calendar found");
                return;
            }
            
            long startTimeLong = (long) startTime;
            long endTimeLong = (long) endTime;
            
            values.put(CalendarContract.Events.CALENDAR_ID, calendarId);
            values.put(CalendarContract.Events.TITLE, title != null ? title : "Напоминание");
            values.put(CalendarContract.Events.DESCRIPTION, description != null ? description : "");
            values.put(CalendarContract.Events.DTSTART, startTimeLong);
            values.put(CalendarContract.Events.DTEND, endTimeLong > 0 ? endTimeLong : startTimeLong + 60 * 60 * 1000);
            values.put(CalendarContract.Events.EVENT_TIMEZONE, TimeZone.getDefault().getID());
            values.put(CalendarContract.Events.HAS_ALARM, 1);
            
            Log.d(TAG, "Adding event: " + title + " at " + startTimeLong);
            
            Uri uri = contentResolver.insert(CalendarContract.Events.CONTENT_URI, values);
            
            if (uri != null) {
                long eventId = Long.parseLong(uri.getLastPathSegment());
                Log.d(TAG, "Event added with ID: " + eventId);
                
                // Добавляем напоминание за 10 минут
                ContentValues reminderValues = new ContentValues();
                reminderValues.put(CalendarContract.Reminders.EVENT_ID, eventId);
                reminderValues.put(CalendarContract.Reminders.MINUTES, 10);
                reminderValues.put(CalendarContract.Reminders.METHOD, CalendarContract.Reminders.METHOD_ALERT);
                contentResolver.insert(CalendarContract.Reminders.CONTENT_URI, reminderValues);
                
                WritableMap result = Arguments.createMap();
                result.putDouble("eventId", (double) eventId);
                promise.resolve(result);
            } else {
                Log.e(TAG, "Failed to add event");
                promise.reject("ADD_FAILED", "Failed to add event to calendar");
            }
        } catch (SecurityException e) {
            Log.e(TAG, "Security exception: " + e.getMessage());
            promise.reject("PERMISSION_DENIED", "Calendar permission denied: " + e.getMessage());
        } catch (Exception e) {
            Log.e(TAG, "Error: " + e.getMessage());
            promise.reject("ERROR", e.getMessage());
        }
    }

    @ReactMethod
    public void removeEvent(double eventId, Promise promise) {
        try {
            Context context = getReactApplicationContext();
            
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                if (context.checkSelfPermission(Manifest.permission.WRITE_CALENDAR) != PackageManager.PERMISSION_GRANTED) {
                    Log.e(TAG, "Write calendar permission denied for remove");
                    promise.reject("PERMISSION_DENIED", "Calendar permission not granted");
                    return;
                }
            }
            
            Uri uri = Uri.parse(CalendarContract.Events.CONTENT_URI + "/" + (long) eventId);
            int rowsDeleted = getReactApplicationContext().getContentResolver().delete(uri, null, null);
            
            if (rowsDeleted > 0) {
                Log.d(TAG, "Event removed: " + eventId);
                promise.resolve(true);
            } else {
                Log.w(TAG, "Event not found: " + eventId);
                promise.reject("REMOVE_FAILED", "Event not found or could not be deleted");
            }
        } catch (SecurityException e) {
            Log.e(TAG, "Security exception: " + e.getMessage());
            promise.reject("PERMISSION_DENIED", "Calendar permission denied: " + e.getMessage());
        } catch (Exception e) {
            Log.e(TAG, "Error: " + e.getMessage());
            promise.reject("ERROR", e.getMessage());
        }
    }

    private long getDefaultCalendarId(ContentResolver contentResolver) {
        String[] projection = new String[]{
            CalendarContract.Calendars._ID,
            CalendarContract.Calendars.ACCOUNT_NAME,
            CalendarContract.Calendars.CALENDAR_DISPLAY_NAME
        };
        
        String selection = CalendarContract.Calendars.VISIBLE + " = 1";
        
        try (Cursor cursor = contentResolver.query(
                CalendarContract.Calendars.CONTENT_URI,
                projection,
                selection,
                null,
                null)) {
            
            if (cursor != null && cursor.moveToFirst()) {
                long calendarId = cursor.getLong(0);
                Log.d(TAG, "Found calendar ID: " + calendarId);
                return calendarId;
            }
        } catch (SecurityException e) {
            Log.e(TAG, "Security exception getting calendar: " + e.getMessage());
        } catch (Exception e) {
            Log.e(TAG, "Error getting calendar: " + e.getMessage());
        }
        
        Log.e(TAG, "No calendar found");
        return -1;
    }
}
