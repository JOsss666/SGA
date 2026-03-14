// 1. IMPORTANTE: Agregar ipcMain aquí
import { app, BrowserWindow, ipcMain } from 'electron'; 
import fs from 'fs';
import os from 'os';
import path from 'path';
import { exec } from 'child_process';
import ptp from 'pdf-to-printer';
import { printer as ThermalPrinter, types as PrinterTypes } from 'node-thermal-printer';

let mainWindow;

console.log('V1.0')

// Función para detectar impresoras (la mantenemos igual)
async function getTargetPrinter() {
    const printers = await mainWindow.webContents.getPrintersAsync();
    const target = printers.find(p => 
        p.name.toUpperCase().includes('SGA') || 
        p.name.toUpperCase().includes('POS') || 
        p.name.toUpperCase().includes('THERMAL')
    );
    if (target) return target.name;
    const defaultPrinter = printers.find(p => p.isDefault);
    return defaultPrinter ? defaultPrinter.name : null;
}

async function executeSmartPrint(htmlContent, label = "Documento") {
    let tempWindow = new BrowserWindow({ 
        show: false, 
        webPreferences: { offscreen: true } // Optimiza para capturas de pantalla
    });

    try{
        console.log('--- Iniciando Proceso de Impresión ---');
        
        // 1. Preparar el contenido en la ventana oculta
        await tempWindow.loadURL('about:blank');
        await tempWindow.webContents.executeJavaScript(`
            document.body.style.margin = "0";
            document.body.style.padding = "0";
            document.body.style.width = "300px"; // Ancho típico de POS 80mm
            document.body.innerHTML = \`${htmlContent}\`;
        `);

        // Esperar un momento a que el renderizado (imágenes/estilos) termine
        await new Promise(resolve => setTimeout(resolve, 500));

        // 2. Intentar detectar impresora USB/Sistema
        const printerName = await getTargetPrinter();

        if (printerName) {
            console.log('USB Detectado:', printerName);
            
            tempWindow.webContents.print({
                silent: true,
                deviceName: printerName,
                printBackground: true,
                margins: { marginType: 'none' }
            }, (success, errorType) => {
                if (!success) console.error('Error USB:', errorType);
                else console.log('Impresión USB enviada con éxito');
            });

        } else {
            // 3. RESPALDO LAN (Si no hay USB)
            console.log('No se detectó USB. Intentando vía LAN...');
            
            // Capturamos el HTML como imagen para que el diseño no se pierda
            const image = await tempWindow.webContents.capturePage();
            const imageBuffer = image.toPNG();

            const LAN_IP = "192.168.1.50"; // 👈 AQUÍ PON LA IP DE TU IMPRESORA LAN

            let printer = new ThermalPrinter({
                type: PrinterTypes.EPSON, // O PrinterTypes.STAR según tu marca
                interface: `tcp://${LAN_IP}`,
            });

            // Enviamos la imagen del ticket
            await printer.printImageBuffer(imageBuffer);
            printer.cut(); // El comando de corte que necesitabas

            try {
                await printer.execute();
                console.log('Impresión LAN enviada con éxito');
            } catch (lanError) {
                console.error('Error: No se pudo conectar a la impresora LAN en', LAN_IP);
            }
        }
    } catch (e) {
        console.error('Error crítico en el flujo de impresión:', e);
    } finally {
        // Cerramos la ventana después de un tiempo prudente
        setTimeout(() => {
            if (!tempWindow.isDestroyed()) tempWindow.destroy();
        }, 3000);
    }
}


// Usa este evento para probar si la impresora reacciona sin basura de código PDF

ipcMain.on('print-receipt', async (event, htmlContent) => {
    await executeSmartPrint(htmlContent, "Recibo/Factura");
});

ipcMain.on('print-test', async (event, htmlContent) => {
    await executeSmartPrint(htmlContent, "Recibo/Factura");
});

ipcMain.on('print-order', async (event, htmlContent) => {
    await executeSmartPrint(htmlContent, "Recibo/Factura");
});


const isDev = !app.isPackaged;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            devTools: false // 👈 Forzar devtools
        }
    });

    console.log("App is packaged:", app.isPackaged);

    //if (isDev) {
        //mainWindow.loadURL('https://facturation.sga360.co');
        mainWindow.loadURL('http://localhost:5173/');
        mainWindow.webContents.openDevTools();
/*} else {
        const indexPath = path.join(app.getAppPath(), 'dist', 'index.html');
        console.log("Loading:", indexPath);

        mainWindow.loadFile(indexPath);
        mainWindow.webContents.openDevTools(); // 👈 Temporal para debug
    }*/
}



 // APP Version and window control

    app.whenReady().then(() => {
        createWindow();

        if (!isDev) {
            autoUpdater.checkForUpdatesAndNotify();
        }

        autoUpdater.on('update-available', () => {
            mainWindow.webContents.send('update_available');
        });

        autoUpdater.on('update-downloaded', () => {
            mainWindow.webContents.send('update_downloaded');
        });

        autoUpdater.on('error', (err) => {
            console.error('Error en autoUpdater:', err);
        });
    });

    ipcMain.on('restart_app', () => {
        autoUpdater.quitAndInstall();
    });