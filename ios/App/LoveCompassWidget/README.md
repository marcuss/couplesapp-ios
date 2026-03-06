# LoveCompassWidget — iOS Widget Extension

Daily Question widget for LoveCompass app using WidgetKit.

## Setup in Xcode

1. Open `ios/App/App.xcodeproj` in Xcode
2. File → New → Target → Widget Extension
   - Product Name: `LoveCompassWidget`
   - Bundle ID: `com.nextasy.couplesapp.widget`
   - Include Configuration Intent: **No** (static configuration)
3. Replace the generated `.swift` file contents with `LoveCompassWidget.swift`
4. Add App Group capability to both the main app and widget targets:
   - `group.com.nextasy.couplesapp`
5. In the main app, when saving auth session, also write to the shared UserDefaults:
   ```swift
   let shared = UserDefaults(suiteName: "group.com.nextasy.couplesapp")
   shared?.set(accessToken, forKey: "supabase.auth.token")
   shared?.set(coupleId, forKey: "supabase.couple.id")
   ```

## Data Flow

```
Capacitor App
    ↓ saves auth token to UserDefaults (App Group)
Widget Extension
    ↓ reads token on timeline refresh
Supabase RPC: get_daily_question(couple_id)
    ↓ returns question JSON
Widget View
    → displays question with rose-pink gradient
```

## Deep Link

Tapping the widget opens `lovecompass://daily-question` which routes to `/daily-question` in the Capacitor web view.

## Design

- Size: `.systemMedium` (default Home Screen widget size)
- Background: rose-500 → pink-400 gradient
- Typography: bold white text
- Category badge with emoji + name
- 🧭 compass icon in top right corner
- Refreshes daily at midnight
