import SwiftUI

@main
struct FocusFilterApp: App {
    var body: some Scene {
        #if os(macOS)
        WindowGroup {
            ContentView()
                .frame(minWidth: 480, minHeight: 400)
        }
        .windowResizability(.contentSize)
        #else
        WindowGroup {
            ContentView()
        }
        #endif
    }
}
