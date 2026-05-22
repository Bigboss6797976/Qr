import UIKit
import Capacitor
import AVFoundation

class MainViewController: CAPBridgeViewController {

    override func viewDidLoad() {
        super.viewDidLoad()

        // 配置WebView
        webView?.scrollView.bounces = false
        webView?.allowsLinkPreview = false

        // 监听应用从后台返回
        NotificationCenter.default.addObserver(
            self,
            selector: #selector(handleAppDidBecomeActive),
            name: NSNotification.Name("appDidBecomeActive"),
            object: nil
        )
    }

    @objc func handleAppDidBecomeActive() {
        // 用户从支付宝/微信返回时，通知WebView刷新订单状态
        webView?.evaluateJavaScript("window.dispatchEvent(new Event('appresume'))", completionHandler: nil)
    }

    override func capacitorDidLoad() {
        bridge?.registerPluginType(QRScannerPlugin.self)
    }
}

// 自定义二维码扫描插件
@objc(QRScannerPlugin)
public class QRScannerPlugin: CAPPlugin, AVCaptureMetadataOutputObjectsDelegate {

    var captureSession: AVCaptureSession?
    var previewLayer: AVCaptureVideoPreviewLayer?

    @objc func scan(_ call: CAPPluginCall) {
        DispatchQueue.main.async {
            guard let captureDevice = AVCaptureDevice.default(for: .video) else {
                call.reject("无法访问相机")
                return
            }

            do {
                let input = try AVCaptureDeviceInput(device: captureDevice)
                let captureSession = AVCaptureSession()
                self.captureSession = captureSession

                captureSession.addInput(input)

                let metadataOutput = AVCaptureMetadataOutput()
                captureSession.addOutput(metadataOutput)
                metadataOutput.setMetadataObjectsDelegate(self, queue: DispatchQueue.main)
                metadataOutput.metadataObjectTypes = [.qr]

                let previewLayer = AVCaptureVideoPreviewLayer(session: captureSession)
                previewLayer.videoGravity = .resizeAspectFill

                // 创建扫描界面
                let scannerVC = ScannerViewController()
                scannerVC.previewLayer = previewLayer
                scannerVC.captureSession = captureSession
                scannerVC.onScan = { result in
                    call.resolve(["result": result])
                }
                scannerVC.onCancel = {
                    call.reject("用户取消扫描")
                }

                self.bridge?.viewController?.present(scannerVC, animated: true)
                captureSession.startRunning()

            } catch {
                call.reject("相机初始化失败: \(error.localizedDescription)")
            }
        }
    }

    public func metadataOutput(_ output: AVCaptureMetadataOutput, didOutput metadataObjects: [AVMetadataObject], from connection: AVCaptureConnection) {
        if let metadataObject = metadataObjects.first as? AVMetadataMachineReadableCodeObject,
           let stringValue = metadataObject.stringValue {
            captureSession?.stopRunning()
            if let scannerVC = bridge?.viewController?.presentedViewController as? ScannerViewController {
                scannerVC.dismiss(animated: true) {
                    scannerVC.onScan?(stringValue)
                }
            }
        }
    }
}

// 扫描界面
class ScannerViewController: UIViewController {
    var previewLayer: AVCaptureVideoPreviewLayer?
    var captureSession: AVCaptureSession?
    var onScan: ((String) -> Void)?
    var onCancel: (() -> Void)?

    override func viewDidLoad() {
        super.viewDidLoad()
        view.backgroundColor = .black

        if let previewLayer = previewLayer {
            previewLayer.frame = view.layer.bounds
            view.layer.addSublayer(previewLayer)
        }

        // 扫描框
        let scanFrame = UIView()
        scanFrame.translatesAutoresizingMaskIntoConstraints = false
        scanFrame.layer.borderColor = UIColor(red: 0.4, green: 0.47, blue: 0.92, alpha: 1).cgColor
        scanFrame.layer.borderWidth = 2
        scanFrame.layer.cornerRadius = 12
        view.addSubview(scanFrame)

        NSLayoutConstraint.activate([
            scanFrame.centerXAnchor.constraint(equalTo: view.centerXAnchor),
            scanFrame.centerYAnchor.constraint(equalTo: view.centerYAnchor),
            scanFrame.widthAnchor.constraint(equalTo: view.widthAnchor, multiplier: 0.7),
            scanFrame.heightAnchor.constraint(equalTo: scanFrame.widthAnchor)
        ])

        // 取消按钮
        let cancelButton = UIButton(type: .system)
        cancelButton.setTitle("取消", for: .normal)
        cancelButton.setTitleColor(.white, for: .normal)
        cancelButton.titleLabel?.font = UIFont.systemFont(ofSize: 18)
        cancelButton.addTarget(self, action: #selector(cancelTapped), for: .touchUpInside)
        cancelButton.translatesAutoresizingMaskIntoConstraints = false
        view.addSubview(cancelButton)

        NSLayoutConstraint.activate([
            cancelButton.bottomAnchor.constraint(equalTo: view.safeAreaLayoutGuide.bottomAnchor, constant: -30),
            cancelButton.centerXAnchor.constraint(equalTo: view.centerXAnchor)
        ])

        // 提示文字
        let label = UILabel()
        label.text = "将二维码放入框内"
        label.textColor = .white
        label.font = UIFont.systemFont(ofSize: 14)
        label.textAlignment = .center
        label.translatesAutoresizingMaskIntoConstraints = false
        view.addSubview(label)

        NSLayoutConstraint.activate([
            label.topAnchor.constraint(equalTo: scanFrame.bottomAnchor, constant: 20),
            label.centerXAnchor.constraint(equalTo: view.centerXAnchor)
        ])
    }

    @objc func cancelTapped() {
        captureSession?.stopRunning()
        dismiss(animated: true) {
            self.onCancel?()
        }
    }

    override func viewWillDisappear(_ animated: Bool) {
        super.viewWillDisappear(animated)
        captureSession?.stopRunning()
    }
}
