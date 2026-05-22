const { contextBridge, ipcRenderer } = require('electron');

// 暴露安全的API给前端
contextBridge.exposeInMainWorld('electronAPI', {
    // 文件选择
    selectFile: () => ipcRenderer.invoke('select-file'),

    // 保存文件
    saveFile: (data) => ipcRenderer.invoke('save-file', data),

    // 打开外部链接
    openExternal: (url) => ipcRenderer.invoke('open-external', url),

    // 获取版本
    getVersion: () => ipcRenderer.invoke('get-app-version'),

    // 平台检测
    isDesktop: true,
    platform: process.platform,

    // 监听事件
    onAppResume: (callback) => {
        ipcRenderer.on('app-resume', callback);
    }
});

// 兼容性：模拟 Capacitor API
contextBridge.exposeInMainWorld('Capacitor', {
    isNativePlatform: () => false,
    platform: 'desktop'
});
