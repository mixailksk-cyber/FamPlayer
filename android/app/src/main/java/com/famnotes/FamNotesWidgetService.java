package com.famnotes;

import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.widget.RemoteViews;
import android.widget.RemoteViewsService;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.util.ArrayList;
import java.util.List;

public class FamNotesWidgetService extends RemoteViewsService {

    private static final String SHARED_PREFS_NAME = "FamNotesWidgetPrefs";
    private static final String KEY_WIDGET_NOTES = "widget_notes";
    private static String sCachedNotesJson = "[]";

    public static void updateWidgetData(Context context, String notesJson) {
        sCachedNotesJson = notesJson;
        SharedPreferences prefs = context.getSharedPreferences(SHARED_PREFS_NAME, Context.MODE_PRIVATE);
        prefs.edit().putString(KEY_WIDGET_NOTES, notesJson).apply();
    }

    @Override
    public RemoteViewsFactory onGetViewFactory(Intent intent) {
        return new WidgetListViewsFactory(getApplicationContext());
    }

    private static class WidgetListViewsFactory implements RemoteViewsService.RemoteViewsFactory {
        private Context mContext;
        private List<WidgetNoteItem> mNotes = new ArrayList<>();

        WidgetListViewsFactory(Context context) {
            mContext = context;
        }

        @Override
        public void onCreate() {
            loadNotes();
        }

        @Override
        public void onDataSetChanged() {
            loadNotes();
        }

        private void loadNotes() {
            mNotes.clear();
            try {
                SharedPreferences prefs = mContext.getSharedPreferences(SHARED_PREFS_NAME, Context.MODE_PRIVATE);
                String notesJson = prefs.getString(KEY_WIDGET_NOTES, "[]");
                
                JSONArray notesArray = new JSONArray(notesJson);
                for (int i = 0; i < notesArray.length(); i++) {
                    JSONObject note = notesArray.getJSONObject(i);
                    WidgetNoteItem item = new WidgetNoteItem();
                    item.title = note.optString("title", "");
                    item.content = note.optString("content", "");
                    mNotes.add(item);
                }
            } catch (JSONException e) {
                e.printStackTrace();
            }
        }

        @Override
        public void onDestroy() {
            mNotes.clear();
        }

        @Override
        public int getCount() {
            return mNotes.size();
        }

        @Override
        public RemoteViews getViewAt(int position) {
            if (position < 0 || position >= mNotes.size()) {
                return null;
            }
            
            WidgetNoteItem note = mNotes.get(position);
            RemoteViews views = new RemoteViews(mContext.getPackageName(), R.layout.widget_list_item);
            
            // Заголовок
            if (note.title != null && !note.title.isEmpty()) {
                views.setTextViewText(R.id.widget_item_title, note.title);
                views.setViewVisibility(R.id.widget_item_title, android.view.View.VISIBLE);
            } else {
                views.setViewVisibility(R.id.widget_item_title, android.view.View.GONE);
            }
            
            // Содержимое
            if (note.content != null && !note.content.isEmpty()) {
                String shortContent = note.content.length() > 60 ? note.content.substring(0, 60) + "..." : note.content;
                views.setTextViewText(R.id.widget_item_content, shortContent);
                views.setViewVisibility(R.id.widget_item_content, android.view.View.VISIBLE);
            } else {
                views.setViewVisibility(R.id.widget_item_content, android.view.View.GONE);
            }
            
            // Если нет ни заголовка, ни содержимого
            if ((note.title == null || note.title.isEmpty()) && (note.content == null || note.content.isEmpty())) {
                views.setTextViewText(R.id.widget_item_title, "Без названия");
                views.setViewVisibility(R.id.widget_item_title, android.view.View.VISIBLE);
                views.setViewVisibility(R.id.widget_item_content, android.view.View.GONE);
            }
            
            return views;
        }

        @Override
        public RemoteViews getLoadingView() {
            return null;
        }

        @Override
        public int getViewTypeCount() {
            return 1;
        }

        @Override
        public long getItemId(int position) {
            return position;
        }

        @Override
        public boolean hasStableIds() {
            return true;
        }
        
        private static class WidgetNoteItem {
            String title;
            String content;
        }
    }
}
