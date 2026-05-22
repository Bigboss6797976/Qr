package com.xuyang.qrpay;

import android.content.Intent;
import android.net.Uri;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "Alipay")
public class AlipayPlugin extends Plugin {

    @PluginMethod
    public void pay(PluginCall call) {
        String url = call.getString("url");
        if (url == null || url.isEmpty()) {
            call.reject("URL不能为空");
            return;
        }

        try {
            Intent intent = new Intent(Intent.ACTION_VIEW, Uri.parse(url));
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            getContext().startActivity(intent);

            JSObject ret = new JSObject();
            ret.put("success", true);
            call.resolve(ret);
        } catch (Exception e) {
            call.reject("唤起支付宝失败: " + e.getMessage());
        }
    }

    @PluginMethod
    public void isInstalled(PluginCall call) {
        boolean installed = false;
        try {
            getContext().getPackageManager().getPackageInfo("com.eg.android.AlipayGphone", 0);
            installed = true;
        } catch (Exception e) {
            installed = false;
        }

        JSObject ret = new JSObject();
        ret.put("installed", installed);
        call.resolve(ret);
    }
}
