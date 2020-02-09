import { ipcMain, BrowserWindow } from 'electron';
import IpcMainEvent = Electron.IpcMainEvent;

export class IpcRoot {
    public static send<T> (type: string, data?: T): void {
        BrowserWindow.getAllWindows().forEach((win: BrowserWindow) => {
            win.webContents.send(type, data);
        });
    }

    public static on<T>(type: string, listener: (data: T) => void): void {
        ipcMain.on(type, (evt: IpcMainEvent, data: T): void => {
            listener(data);
        });
    }
}