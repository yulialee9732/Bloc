import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  openMainWindow: () => ipcRenderer.invoke('open-main-window'),
  onTimerUpdate: (callback: (data: any) => void) =>
    ipcRenderer.on('timer-update', (_event, data) => callback(data)),
  playSound: (sound: string) => ipcRenderer.invoke('play-sound', sound),
});
