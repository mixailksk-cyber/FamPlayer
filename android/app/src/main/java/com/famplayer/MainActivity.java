package com.famplayer;

import android.content.Intent;
import android.os.Bundle;

import com.facebook.react.ReactActivity;
import com.facebook.react.ReactActivityDelegate;
import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint;
import com.facebook.react.defaults.DefaultReactActivityDelegate;
import com.facebook.react.modules.core.DeviceEventManagerModule;

public class MainActivity extends ReactActivity {

  @Override
  protected String getMainComponentName() {
    return "FamPlayer";
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
  public void onNewIntent(Intent intent) {
    super.onNewIntent(intent);
    setIntent(intent);
    handleIntent(intent);
  }

  private void handleIntent(Intent intent) {
    if (intent != null && intent.getBooleanExtra("create_new_note", false)) {
      // Передаем событие в React Native
      try {
        if (getReactNativeHost().getReactInstanceManager().getCurrentReactContext() != null) {
          getReactNativeHost().getReactInstanceManager()
              .getCurrentReactContext()
              .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
              .emit("createNewNote", null);
        }
      } catch (Exception e) {
        e.printStackTrace();
      }
    }
  }
}
