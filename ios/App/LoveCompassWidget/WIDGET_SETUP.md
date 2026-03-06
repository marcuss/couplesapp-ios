# LoveCompassWidget — Setup & Configuration

## Status
✅ Swift code is complete in `ios/App/LoveCompassWidget/LoveCompassWidget.swift`  
✅ `Info.plist` with `NSExtensionPointIdentifier = com.apple.widgetkit-extension`  
✅ Widget Extension Target added to `App.xcodeproj/project.pbxproj`  
✅ "Embed Foundation Extensions" build phase added to the App target

## What Was Added to project.pbxproj

The following was automatically configured:
- `PBXNativeTarget` for `LoveCompassWidget` (type: `com.apple.product-type.app-extension`)
- `PBXSourcesBuildPhase` — includes `LoveCompassWidget.swift`
- `PBXResourcesBuildPhase` — includes `Info.plist`
- `PBXFrameworksBuildPhase` (empty; WidgetKit is linked via Swift import)
- `PBXCopyFilesBuildPhase` — "Embed Foundation Extensions" in the main **App** target
- `XCBuildConfiguration` Debug + Release for `LoveCompassWidget`
- Bundle ID: `com.nextasy.couplesapp.widget`
- Deployment target: iOS 16.0

## First Open in Xcode

When you open `ios/App/App.xcworkspace` for the first time after this change:

1. Xcode may prompt **"Fix issue"** for signing — click it and choose your team.
2. Select the **LoveCompassWidget** scheme and run on a real device or simulator (iOS 16+).

## App Group (Shared UserDefaults)

The widget reads from `group.com.nextasy.couplesapp` UserDefaults. You must enable this App Group capability in the **Apple Developer Portal** for both targets:

1. Go to [developer.apple.com/account](https://developer.apple.com/account)
2. Identifiers → `com.nextasy.couplesapp` → Capabilities → App Groups → add `group.com.nextasy.couplesapp`
3. Identifiers → `com.nextasy.couplesapp.widget` → same App Group
4. In Xcode: select **App** target → Signing & Capabilities → + Capability → App Groups → `group.com.nextasy.couplesapp`
5. Repeat for **LoveCompassWidget** target

## Writing Auth Token from Capacitor App

In your Capacitor app, after login, store the session token so the widget can read it:

```typescript
import { Preferences } from '@capacitor/preferences';

// After successful Supabase auth:
await Preferences.set({
  key: 'supabase_session',
  value: JSON.stringify(session),
});
```

Or write directly to the shared App Group UserDefaults in native Swift/Obj-C if you have a Capacitor plugin.

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Widget doesn't appear in widget gallery | Ensure App Group capability is enabled for both targets |
| "No such module 'WidgetKit'" | Deployment target must be iOS 14+ (currently set to 16.0) |
| Widget shows "Please log in" | Auth token not written to App Group UserDefaults |
| Build fails: missing entitlements | Re-generate provisioning profiles after adding App Group |
