package com.xuyang.qrpay;

import android.os.Bundle;
import android.webkit.WebSettings;
import android.webkit.WebView;
import com.getcapacitor.BridgeActivity;
import com.getcapacitor.Plugin;
import java.util.ArrayList;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(QRScannerPlugin.class);
        registerPlugin(AlipayPlugin.class);
        super.onCreate(savedInstanceState);

        // 配置WebView
        WebView webView = getBridge().getWebView();
        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setDatabaseEnabled(true);
        settings.setCacheMode(WebSettings.LOAD_DEFAULT);

        // 允许支付宝/微信跳转
        settings.setSupportMultipleWindows(true);
    }

    @Override
    protected void onResume() {
        super.onResume();
        // 从支付宝/微信返回时通知WebView
        getBridge().getWebView().evaluateJavascript(
            "window.dispatchEvent(new Event('appresume'))", 
            null
        );
    }
}
