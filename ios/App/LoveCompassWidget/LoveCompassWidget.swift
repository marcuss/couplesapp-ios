// LoveCompassWidget.swift
// Daily Question Widget for LoveCompass (Capacitor iOS app)
//
// Reads the auth token stored by the Capacitor app in UserDefaults/Keychain,
// fetches today's daily question from Supabase, and displays it with
// a rose-to-pink gradient matching the app's design.

import WidgetKit
import SwiftUI

// MARK: - Constants

private enum SupabaseConfig {
    static let url = "https://klpshxvjzsdqolkrabvb.supabase.co"
    static let anonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtscHNoeHZqenNkcW9sa3JhYnZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDA5NTQ5NzUsImV4cCI6MjA1NjUzMDk3NX0.LuQPRBTPnABknkHGmUGMHu_D-LMn4JtSCF5V2V7ZQAM"
    /// App group used to share UserDefaults between the main app and the widget extension
    static let appGroup = "group.com.nextasy.couplesapp"
}

// MARK: - Models

struct DailyQuestionEntry: TimelineEntry {
    let date: Date
    let questionText: String
    let category: String
    let isLoggedIn: Bool
    let errorMessage: String?
}

// MARK: - Auth Token Helper

private struct AuthHelper {
    /// Reads the Supabase auth token stored by the Capacitor app.
    /// Capacitor stores data in UserDefaults with key "CapacitorStorage.*"
    /// or directly in the shared app group.
    static func loadAuthToken() -> (token: String, coupleId: String)? {
        // Try the shared App Group UserDefaults first
        let sharedDefaults = UserDefaults(suiteName: SupabaseConfig.appGroup)
        
        if let token = sharedDefaults?.string(forKey: "supabase.auth.token"),
           let coupleId = sharedDefaults?.string(forKey: "supabase.couple.id"),
           !token.isEmpty, !coupleId.isEmpty {
            return (token, coupleId)
        }
        
        // Fallback: try standard Capacitor storage keys
        if let token = UserDefaults.standard.string(forKey: "CapacitorStorage.supabase.auth.token"),
           let coupleId = UserDefaults.standard.string(forKey: "CapacitorStorage.supabase.couple.id"),
           !token.isEmpty, !coupleId.isEmpty {
            return (token, coupleId)
        }
        
        return nil
    }
}

// MARK: - Network

private struct DailyQuestionFetcher {
    static func fetch(coupleId: String, token: String) async -> (text: String, category: String)? {
        guard let url = URL(string: "\(SupabaseConfig.url)/rest/v1/rpc/get_daily_question") else {
            return nil
        }
        
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.setValue("application/json", forHTTPHeaderField: "Accept")
        request.setValue(SupabaseConfig.anonKey, forHTTPHeaderField: "apikey")
        request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        request.httpBody = try? JSONSerialization.data(withJSONObject: ["p_couple_id": coupleId])
        request.timeoutInterval = 15
        
        do {
            let (data, response) = try await URLSession.shared.data(for: request)
            guard let httpResponse = response as? HTTPURLResponse,
                  (200...299).contains(httpResponse.statusCode) else {
                return nil
            }
            
            if let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
               let translations = json["translations"] as? [String: String] {
                // Prefer device locale, fallback to English
                let langCode = Locale.current.language.languageCode?.identifier ?? "en"
                let text = translations[langCode] ?? translations["en"] ?? "What do you love most about us?"
                let category = json["category"] as? String ?? "communication"
                return (text, category)
            }
        } catch {
            // Silent fail — show fallback
        }
        
        return nil
    }
}

// MARK: - Timeline Provider

struct DailyQuestionProvider: TimelineProvider {
    typealias Entry = DailyQuestionEntry
    
    func placeholder(in context: Context) -> DailyQuestionEntry {
        DailyQuestionEntry(
            date: Date(),
            questionText: "What's one thing I do that makes you feel truly heard?",
            category: "communication",
            isLoggedIn: true,
            errorMessage: nil
        )
    }
    
    func getSnapshot(in context: Context, completion: @escaping (DailyQuestionEntry) -> Void) {
        completion(placeholder(in: context))
    }
    
    func getTimeline(in context: Context, completion: @escaping (Timeline<DailyQuestionEntry>) -> Void) {
        Task {
            let entry = await buildEntry()
            // Refresh once per day at midnight
            let nextMidnight = Calendar.current.startOfDay(for: Date()).addingTimeInterval(86400)
            let timeline = Timeline(entries: [entry], policy: .after(nextMidnight))
            completion(timeline)
        }
    }
    
    private func buildEntry() async -> DailyQuestionEntry {
        guard let auth = AuthHelper.loadAuthToken() else {
            return DailyQuestionEntry(
                date: Date(),
                questionText: "",
                category: "",
                isLoggedIn: false,
                errorMessage: "Open LoveCompass to log in"
            )
        }
        
        if let result = await DailyQuestionFetcher.fetch(coupleId: auth.coupleId, token: auth.token) {
            return DailyQuestionEntry(
                date: Date(),
                questionText: result.text,
                category: result.category,
                isLoggedIn: true,
                errorMessage: nil
            )
        }
        
        return DailyQuestionEntry(
            date: Date(),
            questionText: "What do you love most about us?",
            category: "gratitude",
            isLoggedIn: true,
            errorMessage: nil
        )
    }
}

// MARK: - Category Icon

private func categoryIcon(_ category: String) -> String {
    let icons: [String: String] = [
        "communication": "💬", "intimacy": "💕", "dreams": "🌟",
        "memories": "📸", "values": "🌿", "fun": "😄",
        "gratitude": "🙏", "conflict": "🤝", "finances": "💰",
        "growth": "🌱", "family": "👨‍👩‍👧", "adventure": "🗺️"
    ]
    return icons[category] ?? "🧭"
}

// MARK: - Widget View

struct LoveCompassWidgetView: View {
    var entry: DailyQuestionProvider.Entry
    
    var body: some View {
        ZStack {
            // Background gradient: rose → pink (LoveCompass brand colors)
            LinearGradient(
                colors: [
                    Color(red: 0.953, green: 0.267, blue: 0.416), // rose-500
                    Color(red: 0.976, green: 0.447, blue: 0.608), // pink-400
                ],
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )
            
            if !entry.isLoggedIn {
                VStack(spacing: 8) {
                    Text("🧭")
                        .font(.system(size: 32))
                    Text("Open LoveCompass to log in")
                        .font(.caption)
                        .foregroundColor(.white.opacity(0.9))
                        .multilineTextAlignment(.center)
                }
                .padding()
            } else {
                VStack(alignment: .leading, spacing: 8) {
                    // Header row
                    HStack {
                        Text("Question of the Day")
                            .font(.system(size: 11, weight: .semibold))
                            .foregroundColor(.white.opacity(0.85))
                            .textCase(.uppercase)
                            .tracking(0.5)
                        Spacer()
                        Text("🧭")
                            .font(.system(size: 16))
                    }
                    
                    Spacer(minLength: 4)
                    
                    // Category badge
                    HStack(spacing: 4) {
                        Text(categoryIcon(entry.category))
                            .font(.system(size: 12))
                        Text(entry.category.capitalized)
                            .font(.system(size: 11, weight: .medium))
                            .foregroundColor(.white.opacity(0.8))
                    }
                    .padding(.horizontal, 8)
                    .padding(.vertical, 3)
                    .background(Color.white.opacity(0.2))
                    .clipShape(Capsule())
                    
                    // Question text
                    Text(entry.questionText)
                        .font(.system(size: 15, weight: .bold))
                        .foregroundColor(.white)
                        .lineLimit(3)
                        .minimumScaleFactor(0.8)
                    
                    Spacer()
                }
                .padding(14)
            }
        }
    }
}

// MARK: - Widget Configuration

@main
struct LoveCompassWidget: Widget {
    let kind: String = "LoveCompassDailyQuestion"
    
    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: DailyQuestionProvider()) { entry in
            LoveCompassWidgetView(entry: entry)
                .widgetURL(URL(string: "lovecompass://daily-question"))
        }
        .configurationDisplayName("Daily Question")
        .description("See today's couple question from LoveCompass")
        .supportedFamilies([.systemMedium])
    }
}

// MARK: - Preview

struct LoveCompassWidget_Previews: PreviewProvider {
    static var previews: some View {
        Group {
            LoveCompassWidgetView(entry: DailyQuestionEntry(
                date: Date(),
                questionText: "What's one thing I do that makes you feel truly heard and understood by me?",
                category: "communication",
                isLoggedIn: true,
                errorMessage: nil
            ))
            .previewContext(WidgetPreviewContext(family: .systemMedium))
            .previewDisplayName("Answered State")
            
            LoveCompassWidgetView(entry: DailyQuestionEntry(
                date: Date(),
                questionText: "",
                category: "",
                isLoggedIn: false,
                errorMessage: nil
            ))
            .previewContext(WidgetPreviewContext(family: .systemMedium))
            .previewDisplayName("Not Logged In")
        }
    }
}
