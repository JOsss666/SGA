import { app, BrowserWindow, ipcMain } from 'electron';
import unixPrinter from 'unix-print'; 
import ptp from 'pdf-to-printer'; // 🚩 Faltaba esta importación
import fs from 'fs';
import os from 'os';
import path from 'path';

let mainWindow;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            nodeIntegration: true, 
            contextIsolation: false,
            webSecurity: false 
        }
    });

    //mainWindow.loadURL('https://facturation.sga360.co');
    mainWindow.loadURL('http://localhost:5173/');
    mainWindow.on('closed', () => { mainWindow = null; });
}

ipcMain.on('print-receipt', async (event, htmlContent) => {
    let tempWindow = new BrowserWindow({ show: false });
    
    try {
        await tempWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(htmlContent)}`);

        const tempPath = path.join(os.tmpdir(), `recibo-${Date.now()}.pdf`);
        
        // Generamos PDF optimizado para ticket térmico
        const data = await tempWindow.webContents.printToPDF({
            marginsType: 1, // Sin márgenes
            pageSize: { width: 80000, height: 150000 }, // 80mm x 150mm
            printBackground: true
        });

        fs.writeFileSync(tempPath, data);

        if (process.platform === 'win32') {
            // Configuración para el PC de la oficina
            await ptp.print(tempPath, { printer: "SGA_Termica" });
        } else {
            // Configuración para tu MacBook Air de desarrollo
            await unixPrinter.print(tempPath, 'SGA_Termica', ['-o raw']);
        }
        
        console.log("Impresión enviada correctamente");
    } catch (error) {
        console.error("Fallo en el proceso de impresión:", error);
    } finally {
        tempWindow.close(); // Cerramos siempre la ventana temporal
    }
});

app.whenReady().then(createWindow);