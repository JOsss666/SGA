import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path'

let mainWindow;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            // Esto es clave: permite que la web de Render acceda a funciones de Node
            nodeIntegration: true, 
            contextIsolation: false,
            // Permite cargar scripts locales desde una web remota
            webSecurity: false 
        }
    });

    // Cargamos tu app desde la nube
    
    //mainWindow.loadURL('https://facturation.sga360.co');
    mainWindow.loadURL('http://localhost:5173/SGA_management/logIn');

    mainWindow.on('closed', () => { mainWindow = null; });
}

// Función para listar impresoras y encontrar la térmica
ipcMain.handle('get-printers', async () => {
    let aviablePrinters = await mainWindow.webContents.getPrintersAsync()
    console.log('Impresoras: ',aviablePrinters)
    return aviablePrinters;
});

// Escuchamos la petición de impresión que viene desde la NUBE
ipcMain.on('print-receipt', async (event, htmlContent) => {
    console.log("--- Iniciando proceso de impresión ---"); // Verás esto en la Terminal

    let workerWindow = new BrowserWindow({ show: false });
    workerWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(htmlContent)}`);

    const printers = await workerWindow.webContents.getPrintersAsync();
    
    // 🚩 LOG: Ver todas las impresoras detectadas por el sistema
    console.log("Impresoras detectadas:", printers.map(p => p.name));

    const thermalPrinter = printers.find(p => 
        p.name.toUpperCase().includes('POS') || 
        p.name.includes('80')
    );

    if (thermalPrinter) {
        console.log(`Impresora seleccionada: ${thermalPrinter.name}`);
    } else {
        console.warn("No se encontró impresora térmica. Se usará la predeterminada.");
    }

    workerWindow.webContents.on('did-finish-load', () => {
        workerWindow.webContents.print({
            silent: true,
            deviceName: thermalPrinter ? thermalPrinter.name : ''
        }, (success, failureReason) => {
            // 🚩 LOG: Saber si la orden llegó a la impresora
            if (!success) {
                console.error(`Error de impresión: ${failureReason}`);
            } else {
                console.log("Orden enviada a la cola de impresión exitosamente.");
            }
            setTimeout(() => { workerWindow.close(); }, 1000);
        });
    });
});

app.whenReady().then(createWindow);