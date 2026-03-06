import Foundation

// MARK: - LogEntry

struct LogEntry: Codable {
    let id: String
    let timestamp: Date
    let level: String   // "info" | "warn" | "error" | "network"
    let message: String
    let metadata: [String: String]?

    func toDictionary() -> [String: Any] {
        let formatter = ISO8601DateFormatter()
        formatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        var dict: [String: Any] = [
            "id": id,
            "timestamp": formatter.string(from: timestamp),
            "level": level,
            "message": message,
        ]
        if let meta = metadata {
            dict["metadata"] = meta
        }
        return dict
    }
}

// MARK: - LogInterceptor

/// Thread-safe in-memory log store. Holds up to `maxLogs` entries (FIFO eviction).
class LogInterceptor {
    static let shared = LogInterceptor()
    private init() {}

    private var logs: [LogEntry] = []
    private let maxLogs = 500
    private let queue = DispatchQueue(label: "com.nextasy.couplesapp.loginterceptor", attributes: .concurrent)

    // MARK: Generic log

    func log(_ message: String, level: String = "info", metadata: [String: String]? = nil) {
        let entry = LogEntry(
            id: UUID().uuidString,
            timestamp: Date(),
            level: level,
            message: message,
            metadata: metadata
        )
        appendEntry(entry)
    }

    // MARK: Network helpers

    func logNetworkRequest(url: String, method: String, headers: [String: String] = [:], body: String? = nil) {
        var meta: [String: String] = ["url": url, "method": method, "direction": "request"]
        if let body = body { meta["body"] = body }
        for (k, v) in headers { meta["header_\(k)"] = v }
        log("\(method) \(url)", level: "network", metadata: meta)
    }

    func logNetworkResponse(url: String, statusCode: Int, body: String? = nil, duration: TimeInterval) {
        var meta: [String: String] = [
            "url": url,
            "statusCode": "\(statusCode)",
            "duration": String(format: "%.0f", duration * 1000) + "ms",
            "direction": "response",
        ]
        if let body = body { meta["body"] = body }
        log("\(statusCode) \(url) (\(Int(duration * 1000))ms)", level: "network", metadata: meta)
    }

    // MARK: Access

    func getLogs() -> [LogEntry] {
        var result: [LogEntry] = []
        queue.sync { result = self.logs }
        return result
    }

    func clearLogs() {
        queue.async(flags: .barrier) { self.logs.removeAll() }
    }

    // MARK: Private

    private func appendEntry(_ entry: LogEntry) {
        queue.async(flags: .barrier) {
            self.logs.append(entry)
            if self.logs.count > self.maxLogs {
                self.logs.removeFirst(self.logs.count - self.maxLogs)
            }
        }
    }
}
