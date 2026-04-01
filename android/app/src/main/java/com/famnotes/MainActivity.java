package com.famnotes;

import android.content.Intent;
import android.os.Bundle;

import com.facebook.react.ReactActivity;
import com.facebook.react.ReactActivityDelegate;
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint;
import com.facebook.react.defaults.DefaultReactActivityDelegate;

public class MainActivity extends ReactActivity {

  @Override
  protected String getMainComponentName() {
    return "FamNotes";
  }

  @Override
  protected ReactActivityDelegate createReactActivityDelegate() {
    return new DefaultReactActivityDelegate(
        this,
        getMainComponentName(),
        DefaultNewArchitectureEntryPoint.getFabricEnabled(),
        DefaultNewArchitectureEntryPoint.getConcurrentReactEnabled()
        );
  }

  @Override
  protected void onCreate(Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);
    handleIntent(getIntent());
  }

  @Override
  protected void onNewIntent(Intent intent) {
    super.onNewIntent(intent);
    setIntent(intent);
    handleIntent(intent);
  }

  private void handleIntent(Intent intent) {
    if (intent != null && intent.getBooleanExtra("create_new_note", false)) {
      // Передаем флаг в React Native через deep link
      try {
        // Отправляем событие в React Native
        getReactNativeHost().getReactInstanceManager()
            .getCurrentReactContext()
            .getJSModule(com.facebook.react.bridge.ReactApplicationContext.class)
            .getNativeModule(com.facebook.react.modules.core.DeviceEventManagerModule.RCTDeviceEventEmitter.class)
            .emit("createNewNote", null);
      } catch (Exception e) {
        e.printStackTrace();
      }
    }
  }
}
