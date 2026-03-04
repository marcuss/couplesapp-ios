import Foundation

/// Manages debug feature availability.
/// Debug is enabled in:
///   - DEBUG builds (Simulator + local development)
///   - TestFlight (sandboxReceipt in appStoreReceiptURL)
/// Debug is DISABLED in App Store production builds.
class DebugManager {
    static let shared = DebugManager()
    private init() {}

    /// Returns true when running under TestFlight distribution.
    var isTestFlight: Bool {
        #if DEBUG
        return true  // Always enabled in simulators and local Debug builds
        #else
        guard let receiptURL = Bundle.main.appStoreReceiptURL else { return false }
        return receiptURL.lastPathComponent == "sandboxReceipt"
        #endif
    }

    /// Master switch — other components should check this before enabling debug features.
    var isDebugEnabled: Bool {
        return isTestFlight
    }
}
