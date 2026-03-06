import Capacitor
import Foundation
import UIKit

// MARK: - DebugPlugin

@objc(DebugPlugin)
public class DebugPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "DebugPlugin"
    public let jsName = "Debug"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "isDebugEnabled", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "getLogs",         returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "getDeviceInfo",   returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "clearLogs",       returnType: CAPPluginReturnPromise),
    ]

    // MARK: Plugin lifecycle

    public override func load() {
        NotificationCenter.default.addObserver(
            self,
            selector: #selector(deviceDidShake),
            name: .deviceDidShake,
            object: nil
        )
    }

    // MARK: Plugin methods

    @objc func isDebugEnabled(_ call: CAPPluginCall) {
        call.resolve(["enabled": DebugManager.shared.isDebugEnabled])
    }

    @objc func getLogs(_ call: CAPPluginCall) {
        let logs = LogInterceptor.shared.getLogs()
        call.resolve(["logs": logs.map { $0.toDictionary() }])
    }

    @objc func getDeviceInfo(_ call: CAPPluginCall) {
        let device = UIDevice.current
        let environment: String
        #if DEBUG
        environment = "Debug"
        #else
        environment = DebugManager.shared.isTestFlight ? "TestFlight" : "Production"
        #endif

        call.resolve([
            "model": device.model,
            "systemVersion": device.systemVersion,
            "appVersion": Bundle.main.infoDictionary?["CFBundleShortVersionString"] as? String ?? "?",
            "buildNumber": Bundle.main.infoDictionary?["CFBundleVersion"] as? String ?? "?",
            "environment": environment,
            "bundleId": Bundle.main.bundleIdentifier ?? "?",
        ])
    }

    @objc func clearLogs(_ call: CAPPluginCall) {
        LogInterceptor.shared.clearLogs()
        call.resolve()
    }

    // MARK: Shake → JS event

    @objc private func deviceDidShake() {
        notifyListeners("shake", data: [:])
    }
}
