package com.xuyang.qrpay;

import android.Manifest;
import android.content.pm.PackageManager;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;
import com.google.zxing.BarcodeFormat;
import com.google.zxing.BinaryBitmap;
import com.google.zxing.LuminanceSource;
import com.google.zxing.RGBLuminanceSource;
import com.google.zxing.Result;
import com.google.zxing.common.HybridBinarizer;
import com.google.zxing.qrcode.QRCodeReader;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.provider.MediaStore;
import android.content.Intent;
import android.app.Activity;
import com.getcapacitor.annotation.ActivityCallback;

@CapacitorPlugin(
    name = "QRScanner",
    permissions = {
        @Permission(strings = {Manifest.permission.CAMERA}, alias = "camera"),
        @Permission(strings = {Manifest.permission.READ_EXTERNAL_STORAGE}, alias = "storage")
    }
)
public class QRScannerPlugin extends Plugin {

    private static final int REQUEST_IMAGE_PICK = 1001;
    private PluginCall savedCall;

    @PluginMethod
    public void scan(PluginCall call) {
        savedCall = call;

        if (ContextCompat.checkSelfPermission(getContext(), Manifest.permission.CAMERA) 
                != PackageManager.PERMISSION_GRANTED) {
            requestPermissionForAlias("camera", call, "cameraPermissionCallback");
        } else {
            openImagePicker();
        }
    }

    @PermissionCallback
    private void cameraPermissionCallback(PluginCall call) {
        if (ContextCompat.checkSelfPermission(getContext(), Manifest.permission.CAMERA) 
                == PackageManager.PERMISSION_GRANTED) {
            openImagePicker();
        } else {
            call.reject("需要相机权限");
        }
    }

    private void openImagePicker() {
        Intent intent = new Intent(Intent.ACTION_PICK, MediaStore.Images.Media.EXTERNAL_CONTENT_URI);
        startActivityForResult(savedCall, intent, "imagePickerResult");
    }

    @ActivityCallback
    private void imagePickerResult(PluginCall call, ActivityResult result) {
        if (result.getResultCode() == Activity.RESULT_OK && result.getData() != null) {
            try {
                android.net.Uri selectedImage = result.getData().getData();
                android.database.Cursor cursor = getContext().getContentResolver().query(
                    selectedImage, new String[]{MediaStore.Images.Media.DATA}, null, null, null);
                cursor.moveToFirst();
                String imagePath = cursor.getString(0);
                cursor.close();

                Bitmap bitmap = BitmapFactory.decodeFile(imagePath);
                int width = bitmap.getWidth();
                int height = bitmap.getHeight();
                int[] pixels = new int[width * height];
                bitmap.getPixels(pixels, 0, width, 0, 0, width, height);

                LuminanceSource source = new RGBLuminanceSource(width, height, pixels);
                BinaryBitmap binaryBitmap = new BinaryBitmap(new HybridBinarizer(source));
                QRCodeReader reader = new QRCodeReader();
                Result qrResult = reader.decode(binaryBitmap);

                JSObject ret = new JSObject();
                ret.put("result", qrResult.getText());
                call.resolve(ret);

            } catch (Exception e) {
                call.reject("二维码识别失败: " + e.getMessage());
            }
        } else {
            call.reject("用户取消");
        }
    }
}
