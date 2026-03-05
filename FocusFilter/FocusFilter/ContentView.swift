import SwiftUI
import SafariServices

struct ContentView: View {
    @State private var blockerEnabled = false
    @State private var webExtensionEnabled = false
    @State private var checkingStatus = false

    var body: some View {
        ScrollView {
            VStack(spacing: 24) {
                headerSection
                statusSection
                setupInstructionsSection
                blockedContentSection
            }
            .padding(24)
        }
        .onAppear(perform: checkExtensionStatus)
    }

    private var headerSection: some View {
        VStack(spacing: 8) {
            Image(systemName: "eye.slash.circle.fill")
                .font(.system(size: 64))
                .foregroundStyle(.blue)
            Text("FocusFilter")
                .font(.largeTitle.bold())
            Text("Block short-form video distractions in Safari and Chrome")
                .font(.subheadline)
                .foregroundStyle(.secondary)
        }
        .padding(.bottom, 8)
    }

    private var statusSection: some View {
        VStack(spacing: 12) {
            statusRow(
                enabled: blockerEnabled,
                activeText: "Content Blocker Active",
                inactiveText: "Content Blocker Not Enabled",
                detail: "Blocks page loads and hides video elements via CSS."
            )
            statusRow(
                enabled: webExtensionEnabled,
                activeText: "Web Extension Active",
                inactiveText: "Web Extension Not Enabled",
                detail: "Intercepts in-app navigation and removes video posts dynamically."
            )
            HStack {
                Spacer()
                Button {
                    checkExtensionStatus()
                } label: {
                    Label("Refresh", systemImage: "arrow.clockwise")
                        .font(.caption)
                }
                .disabled(checkingStatus)
            }
        }
        .padding()
        .background(.ultraThinMaterial, in: RoundedRectangle(cornerRadius: 12))
    }

    private func statusRow(enabled: Bool, activeText: String, inactiveText: String, detail: String) -> some View {
        HStack(spacing: 12) {
            Image(systemName: enabled ? "checkmark.circle.fill" : "xmark.circle.fill")
                .font(.title2)
                .foregroundStyle(enabled ? .green : .red)
            VStack(alignment: .leading, spacing: 2) {
                Text(enabled ? activeText : inactiveText)
                    .font(.headline)
                Text(detail)
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }
            Spacer()
        }
    }

    private var setupInstructionsSection: some View {
        VStack(alignment: .leading, spacing: 16) {
            Text("Setup")
                .font(.title2.bold())
            #if os(macOS)
            setupStep(number: 1, text: "Open Safari and go to **Safari > Settings > Extensions**")
            setupStep(number: 2, text: "Enable both **FocusFilter Content Blocker** and **FocusFilter Web Extension**")
            setupStep(number: 3, text: "Click **Turn On** when prompted and allow on all websites")
            #else
            setupStep(number: 1, text: "Open the **Settings** app")
            setupStep(number: 2, text: "Go to **Apps > Safari > Extensions**")
            setupStep(number: 3, text: "Enable **FocusFilter Content Blocker** and toggle it **on**")
            setupStep(number: 4, text: "Enable **FocusFilter Web Extension** and toggle it **on**")
            setupStep(number: 5, text: "Set the Web Extension permission to **Allow** on all websites")
            #endif
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }

    private func setupStep(number: Int, text: LocalizedStringKey) -> some View {
        HStack(alignment: .top, spacing: 12) {
            Text("\(number)")
                .font(.caption.bold())
                .frame(width: 24, height: 24)
                .background(Color.blue)
                .foregroundStyle(.white)
                .clipShape(Circle())
            Text(text)
                .font(.body)
        }
    }

    private var blockedContentSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("What Gets Blocked")
                .font(.title2.bold())
            blockedItem(icon: "play.rectangle.fill", color: .red, title: "YouTube Shorts",
                        detail: "Shorts pages and shelf elements on youtube.com")
            blockedItem(icon: "camera.metering.spot", color: .purple, title: "Instagram Reels",
                        detail: "Reels pages and navigation links on instagram.com")
            blockedItem(icon: "tv.fill", color: .blue, title: "Facebook Reels & Watch",
                        detail: "Reels, Watch, video posts in feed, and shared video links on facebook.com")
            blockedItem(icon: "music.note", color: .primary, title: "TikTok",
                        detail: "Entire site blocked on tiktok.com")
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }

    private func blockedItem(icon: String, color: Color, title: String, detail: String) -> some View {
        HStack(spacing: 12) {
            Image(systemName: icon)
                .font(.title3)
                .foregroundStyle(color)
                .frame(width: 32)
            VStack(alignment: .leading, spacing: 2) {
                Text(title).font(.headline)
                Text(detail).font(.caption).foregroundStyle(.secondary)
            }
        }
    }

    private func checkExtensionStatus() {
        checkingStatus = true
        #if os(iOS)
        let bundleId = Bundle.main.bundleIdentifier!
        let group = DispatchGroup()

        group.enter()
        SFContentBlockerManager.getStateOfContentBlocker(
            withIdentifier: bundleId + ".FocusFilterBlocker"
        ) { state, _ in
            DispatchQueue.main.async {
                blockerEnabled = state?.isEnabled ?? false
                group.leave()
            }
        }

        group.enter()
        SFSafariExtensionManager.getStateOfSafariExtension(
            withIdentifier: bundleId + ".FocusFilterWebExtension"
        ) { state, _ in
            DispatchQueue.main.async {
                webExtensionEnabled = state?.isEnabled ?? false
                group.leave()
            }
        }

        group.notify(queue: .main) {
            checkingStatus = false
        }
        #else
        checkingStatus = false
        #endif
    }
}

#Preview {
    ContentView()
}
