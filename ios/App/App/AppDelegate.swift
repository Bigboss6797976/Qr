import UIKit
import Capacitor

@UIApplicationMain
class AppDelegate: UIApplicationDelegate {

    var window: UIWindow?

    func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
        // 配置状态栏
        UIApplication.shared.statusBarStyle = .lightContent

        // 允许支付宝/微信 URL Scheme 跳转
        return true
    }

    func application(_ app: UIApplication, open url: URL, options: [UIApplication.OpenURLOptionsKey: Any] = [:]) -> Bool {
        // 处理支付宝/微信回调
        if url.scheme == "qrpay" {
            NotificationCenter.default.post(name: NSNotification.Name("CAPAppUrlOpen"), object: url)
            return true
        }
        return ApplicationDelegateProxy.shared.application(app, open: url, options: options)
    }

    func application(_ application: UIApplication, continue userActivity: NSUserActivity, restorationHandler: @escaping ([UIUserActivityRestoring]?) -> Void) -> Bool {
        return ApplicationDelegateProxy.shared.application(application, continue: userActivity, restorationHandler: restorationHandler)
    }

    func applicationDidBecomeActive(_ application: UIApplication) {
        // 应用从后台返回时刷新页面状态
        NotificationCenter.default.post(name: NSNotification.Name("appDidBecomeActive"), object: nil)
    }
}
