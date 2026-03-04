import UIKit
import Capacitor

// MARK: - Notification Name

extension Notification.Name {
    /// Posted on the main thread whenever the user shakes the device (debug builds only).
    static let deviceDidShake = Notification.Name("DeviceDidShake")
}

// MARK: - CAPBridgeViewController Extension

extension CAPBridgeViewController {
    /// Intercepts the shake gesture and broadcasts it when debug is enabled.
    open override func motionEnded(_ motion: UIEvent.EventSubtype, with event: UIEvent?) {
        super.motionEnded(motion, with: event)
        guard motion == .motionShake, DebugManager.shared.isDebugEnabled else { return }
        NotificationCenter.default.post(name: .deviceDidShake, object: nil)
    }
}
