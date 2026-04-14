name: Build Android APK
 
on:
  push:
    branches:
      - main
      - claude/create-minimal-app-ndomw
  workflow_dispatch:
 
jobs:
  build:
    runs-on: ubuntu-latest
 
    steps:
      - uses: actions/checkout@v4
 
      - uses: actions/setup-java@v4
        with:
          distribution: temurin
          java-version: '17'
 
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
 
      - name: Install JS dependencies
        run: npm install
 
      - name: Setup Gradle 8.3
        uses: gradle/actions/setup-gradle@v3
        with:
          gradle-version: '8.3'
 
      - name: Accept Android SDK licenses
        run: yes | $ANDROID_HOME/cmdline-tools/latest/bin/sdkmanager --licenses > /dev/null 2>&1 || true
 
      - name: Install Android SDK components
        run: |
          $ANDROID_HOME/cmdline-tools/latest/bin/sdkmanager \
            "platforms;android-34" \
            "build-tools;34.0.0" \
            "ndk;25.1.8937393"
 
      - name: Generate debug keystore
        run: |
          keytool -genkey -v \
            -keystore android/app/debug.keystore \
            -storepass android \
            -alias androiddebugkey \
            -keypass android \
            -keyalg RSA \
            -keysize 2048 \
            -validity 10000 \
            -dname "CN=Android Debug,O=Android,C=US"
 
      - name: Create local.properties
        run: echo "sdk.dir=$ANDROID_HOME" > android/local.properties
 
      - name: Build debug APK
        working-directory: android
        run: gradle assembleDebug --no-daemon
 
      - uses: actions/upload-artifact@v4
        with:
          name: EDT-LED-Controller-debug
          path: android/app/build/outputs/apk/debug/app-debug.apk
          retention-days: 30
