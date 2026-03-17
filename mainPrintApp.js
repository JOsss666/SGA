import { app, BrowserWindow, ipcMain } from 'electron'; 
import { autoUpdater } from 'electron';
import fs from 'fs';
import os from 'os';
import net from 'net'; // 👈 Importante para el escaneo de red
import path from 'path';
import { exec } from 'child_process';
import ptp from 'pdf-to-printer';
import { printer as ThermalPrinter, types as PrinterTypes } from 'node-thermal-printer';

let mainWindow;
let lastDetectedPrinterIP = null; // Almacenará la IP detectada para no re-escanearen cada impresión

console.log('SGA POS - V1.1 (Dynamic Network Support)');

// --- UTILIDAD DE ESCANEO DE RED ---

async function scanNetworkForPrinters() {
    const interfaces = os.networkInterfaces();
    let networkPrefix = '192.168.1'; // Valor por defecto

    // Intentar detectar el prefijo de red local dinámicamente
    for (const name in interfaces) {
        for (const iface of interfaces[name]) {
            if (iface.family === 'IPv4' && !iface.internal) {
                const parts = iface.address.split('.');
                networkPrefix = `${parts[0]}.${parts[1]}.${parts[2]}`;
            }
        }
    }

    console.log(`Escaneando red: ${networkPrefix}.0/24...`);

    const checkPort = (ip) => {
        return new Promise((resolve) => {
            const socket = new net.Socket();
            socket.setTimeout(400); // Tiempo de espera para cada IP

            socket.on('connect', () => {
                socket.destroy();
                resolve(ip);
            });
            socket.on('error', () => { socket.destroy(); resolve(null); });
            socket.on('timeout', () => { socket.destroy(); resolve(null); });

            socket.connect(9100, ip);
        });
    };

    const scanPromises = [];
    for (let i = 1; i <= 254; i++) {
        scanPromises.push(checkPort(`${networkPrefix}.${i}`));
    }

    const results = await Promise.all(scanPromises);
    const foundPrinters = results.filter(ip => ip !== null);
    
    if (foundPrinters.length > 0) {
        lastDetectedPrinterIP = foundPrinters[0]; // Auto-asignar la primera encontrada
    }
    
    return foundPrinters;
}

// --- LÓGICA DE IMPRESIÓN ---

// ... (tus imports se mantienen igual)

// --- LÓGICA DE SELECCIÓN DE IMPRESORA ---
// Función para verificar si hay un dispositivo USB de impresión activo en el sistema
// ... (tus imports se mantienen igual)

// --- LÓGICA DE VALIDACIÓN DE HARDWARE REAL ---
async function isUsbHardwareConnected(printerName) {
    return new Promise((resolve) => {
        // Consultamos específicamente a Windows si la impresora está 'Offline'
        // Cuando quitas el cable USB, WorkOffline pasa a ser TRUE automáticamente
        const command = `wmic path Win32_Printer where "Name='${printerName}'" get WorkOffline`;
        
        exec(command, (err, stdout) => {
            if (err) {
                // Fallback: Si falla el comando, buscamos en servicios de impresión USB activos
                exec('wmic path Win32_PnPEntity where "Service=\'usbprint\'" get Caption', (err2, stdout2) => {
                    resolve(stdout2.toUpperCase().includes(printerName.toUpperCase()));
                });
                return;
            }
            
            const output = stdout.toUpperCase();
            // Si dice 'FALSE', significa que NO está offline (está conectada)
            const isConnected = output.includes("FALSE");
            
            console.log(`Hardware check para ${printerName}: ${isConnected ? 'CONECTADO' : 'DESCONECTADO'}`);
            resolve(isConnected);
        });
    });
}

async function getTargetPrinter() {
    const printers = await mainWindow.webContents.getPrintersAsync();
    const candidates = printers.filter(p => {
        const nameUpper = p.name.toUpperCase();
        return nameUpper.includes('SGA') || nameUpper.includes('POS') || nameUpper.includes('THERMAL');
    });

    for (const printer of candidates) {
        const hardwareOk = await isUsbHardwareConnected(printer.name);
        if (hardwareOk) return printer.name;
    }
    return null;
}

// --- FUNCIÓN 1: LÓGICA USB ---
async function printUSB(tempWindow, printerName, copies = 1) {
    try {
        console.log(`Enviando ${copies} copia(s) al Spooler USB: ${printerName}`);
        for (let i = 0; i < copies; i++) {
            await new Promise((resolve, reject) => {
                tempWindow.webContents.print({
                    silent: true,
                    deviceName: printerName,
                    printBackground: true,
                    margins: { marginType: 'none' }
                }, (success, failureReason) => {
                    if (success) resolve();
                    else reject(failureReason);
                });
            });
            console.log(`✅ Copia USB ${i + 1} completada.`);
        }
        return true;
    } catch (error) {
        console.error('❌ Error en cola USB:', error);
        return false;
    }
}

// --- FUNCIÓN 2: LÓGICA LAN ---
async function printLAN(tempWindow, ip, copies = 1) {
    try {
        console.log(`Intentando imprimir ${copies} copia(s) por LAN: ${ip}`);
        const image = await tempWindow.webContents.capturePage();
        const imageBuffer = image.toPNG();

        let printer = new ThermalPrinter({
            type: PrinterTypes.EPSON,
            interface: `tcp://${ip}`,
            timeout: 5000,
            width: 576
        });

        const isConnected = await printer.isPrinterConnected();
        if (!isConnected) throw new Error("La impresora de red no responde.");

        for (let i = 0; i < copies; i++) {
            printer.alignCenter();
            await printer.printImageBuffer(imageBuffer);
            printer.cut();
        }
        
        await printer.execute();
        console.log('✅ Éxito LAN: Datos enviados.');
        return true;
    } catch (error) {
        console.error('❌ Error LAN:', error.message);
        return false;
    }
}

// --- FUNCIÓN MAESTRA: CONTROLADOR DE FLUJO ---
async function executeSmartPrint(htmlContent, label = "Documento", copies = 1) {
    let tempWindow = new BrowserWindow({ 
        show: false, 
        webPreferences: { offscreen: true }
    });

    try {
        console.log(`--- Iniciando Flujo: ${label} ---`);
        
        // 1. Preparar el Lienzo (Renderizado)
        await tempWindow.loadURL('about:blank');
        const formattedHtml = `
            <style>
                body { margin: 0; padding: 0; background: white; width: 550px; font-family: sans-serif; }
                * { -webkit-print-color-adjust: exact; }
            </style>
            <div>${htmlContent}</div>
        `;
        
        await tempWindow.webContents.executeJavaScript(`
            document.body.innerHTML = ${JSON.stringify(formattedHtml)};
        `);

        // Esperar a que el motor de renderizado procese imágenes/estilos
        await new Promise(resolve => setTimeout(resolve, 800));

        // 2. INTENTO USB (Validación Estricta)
        const printerName = await getTargetPrinter();
        let success = false;

        if (printerName) {
            success = await printUSB(tempWindow, printerName, copies);
        }

        // 3. RESPALDO LAN (Si el USB no existe o el spooler falló)
        if (!success) {
            console.warn('⚠️ Saltando a respaldo por Red (LAN)...');
            
            if (!lastDetectedPrinterIP) {
                const found = await scanNetworkForPrinters();
                if (found.length > 0) lastDetectedPrinterIP = found[0];
            }

            if (lastDetectedPrinterIP) {
                success = await printLAN(tempWindow, lastDetectedPrinterIP, copies);
            }
        }

        if (!success) {
            console.error('❌ Error Final: No se pudo imprimir por ningún medio.');
        }

    } catch (e) {
        console.error('Error crítico en executeSmartPrint:', e.message);
    } finally {
        // Cerramos la ventana después de un tiempo prudente
        setTimeout(() => { if (!tempWindow.isDestroyed()) tempWindow.destroy(); }, 5000);
    }
}

// Función auxiliar para cargar el contenido
async function prepareWindow(win, html) {
    await win.loadURL('about:blank');
    const styledHtml = `<body style="margin:0; width:576px;">${html}</body>`;
    await win.webContents.executeJavaScript(`document.body.innerHTML = ${JSON.stringify(styledHtml)};`);
    await new Promise(r => setTimeout(r, 500));
}

// --- COMUNICACIÓN IPC ---

// Escáner manual desde el Frontend (para que el usuario elija la IP en Ajustes)
ipcMain.handle('find-network-printers', async () => {
    return await scanNetworkForPrinters();
});

// Guardar IP seleccionada manualmente por el usuario
ipcMain.on('set-printer-ip', (event, ip) => {
    lastDetectedPrinterIP = ip;
    console.log('IP de impresora configurada manualmente:', ip);
});

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