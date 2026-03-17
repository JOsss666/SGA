import { app, BrowserWindow, ipcMain } from 'electron'; 
import { autoUpdater } from 'electron';
import fs from 'fs';
import os from 'os';
import net from 'net';
import path from 'path';
import { exec } from 'child_process';
import { printer as ThermalPrinter, types as PrinterTypes } from 'node-thermal-printer';
import * as pdfConverter from 'pdf-to-img';


// Varibales globales
let mainWindow;
let lastDetectedPrinterIP = null;
let aviablePrinters = []; // Aquí guardaremos el caché


// --- UTILIDAD DE ESCANEO DE RED ---
async function scanNetworkForPrinters() {
    const interfaces = os.networkInterfaces();
    let networkPrefix = '192.168.1';

    for (const name in interfaces) {
        for (const iface of interfaces[name]) {
            if (iface.family === 'IPv4' && !iface.internal) {
                const parts = iface.address.split('.');
                networkPrefix = `${parts[0]}.${parts[1]}.${parts[2]}`;
            }
        }
    }

    const checkPort = (ip) => {
        return new Promise((resolve) => {
            const socket = new net.Socket();
            socket.setTimeout(400);
            socket.on('connect', () => { socket.destroy(); resolve(ip); });
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
    if (foundPrinters.length > 0) lastDetectedPrinterIP = foundPrinters[0];
    aviablePrinters = foundPrinters;
    console.log(aviablePrinters)
    return foundPrinters;
}

// Función para obtener la lista de objetos de impresoras candidatas con ESTADO REAL
async function getAvailablePrinterList() {
    try {
        const printers = await mainWindow.webContents.getPrintersAsync();
        
        const candidates = printers.filter(p => {
            const nameUpper = p.name.toUpperCase();
            return  nameUpper.includes('SGA') || 
                    nameUpper.includes('POS') || 
                    nameUpper.includes('THERMAL');
        });

        // Verificamos el estado físico de cada candidata de forma asíncrona
        const printersWithStatus = await Promise.all(candidates.map(async (printer) => {
            // Usamos tu lógica de hardware (wmic) para saber si está desconectada
            const isConnected = await isUsbHardwareConnected(printer.name);
            
            return {
                ...printer,
                is_online: isConnected,
                // Agregamos una etiqueta fácil de leer para el Frontend
                status_label: isConnected ? 'active' : 'disconected'
            };
        }));

        aviablePrinters = printersWithStatus;
        console.log(`📡 Lista de impresoras actualizada (${printersWithStatus.length})`);
        return printersWithStatus; 

    } catch (error) {
        console.error("Error obteniendo lista de impresoras:", error);
        return [];
    }
}

async function initializePrinters() {
    console.log("🔍 Iniciando escaneo de hardware al arranque...");
    try {
        // Escaneamos ambos: Sistema (Drivers) y Red (IPs)
        const systemPrinters = await getAvailablePrinterList();
        const networkPrinters = await scanNetworkForPrinters();
        
        console.log(`✅ Inicialización completa: 
            - Sistema: ${systemPrinters.length} encontradas
            - Red: ${networkPrinters.length} encontradas`);
    } catch (error) {
        console.error("❌ Error durante la inicialización de impresoras:", error);
    }
}

// --- VALIDACIÓN DE HARDWARE USB ---
async function isUsbHardwareConnected(printerName) {
    return new Promise((resolve) => {
        const command = `wmic path Win32_Printer where "Name='${printerName}'" get WorkOffline`;
        exec(command, (err, stdout) => {
            if (err) {
                exec('wmic path Win32_PnPEntity where "Service=\'usbprint\'" get Caption', (err2, stdout2) => {
                    resolve(stdout2.toUpperCase().includes(printerName.toUpperCase()));
                });
                return;
            }
            resolve(stdout.toUpperCase().includes("FALSE"));
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
        // Verificamos si está en línea (esto funciona para ambos tipos)
        const hardwareOk = await isUsbHardwareConnected(printer.name); 
        if (hardwareOk) return printer.name;
    }
    return null;
}

// --- FUNCIÓN 1: LÓGICA USB ---
async function printUSB(tempWindow, printerName, copies = 1) {
    try {
        for (let i = 0; i < copies; i++) {
            await new Promise((resolve, reject) => {
                tempWindow.webContents.print({
                    silent: true,
                    deviceName: printerName,
                    printBackground: true,
                    margins: { marginType: 'none' }
                }, (success, error) => success ? resolve() : reject(error));
            });
        }
        return true;
    } catch (error) {
        console.error('❌ Error USB:', error);
        return false;
    }
}

async function printSystem(tempWindow, printerName, copies = 1) {
    try {
        console.log(`Enviando a ${printerName} vía Driver de Windows...`);
        for (let i = 0; i < copies; i++) {
            await new Promise((resolve, reject) => {
                tempWindow.webContents.print({
                    silent: true,
                    deviceName: printerName,
                    printBackground: true,
                    margins: { marginType: 'none' }, // Importante: el driver maneja los márgenes
                    // Si el ticket es muy largo, el driver de ticketera expande el papel automáticamente
                }, (success, errorType) => {
                    if (success) resolve();
                    else reject(errorType);
                });
            });
        }
        return true;
    } catch (error) {
        console.error('❌ Error en el spooler de Windows:', error);
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
        // Preparar contenido... (igual que tu código)
        const formattedHtml = `
            <html>
            <head>
                <style>
                    @page { margin: 0; }
                    body { 
                        margin: 0; padding: 5px; 
                        width: 72mm; /* El driver ajustará esto a 80mm automáticamente */
                        font-family: sans-serif; 
                        background: #fff;
                    }
                    img { max-width: 100%; }
                </style>
            </head>
            <body>${htmlContent}</body>
            </html>
        `;
        await tempWindow.loadURL('about:blank');
        await tempWindow.webContents.executeJavaScript(`document.body.innerHTML = ${JSON.stringify(formattedHtml)};`);
        await new Promise(r => setTimeout(r, 800)); // Espera mínima para render

        // 🚀 MEJORA: Ya no escaneamos la red aquí. 
        // Primero intentamos con el driver de Windows (que es lo más rápido)
        const printerName = await getTargetPrinter();

        if (printerName) {
            await printSystem(tempWindow, printerName, copies);
        } else {
            // Si el driver falla, usamos la última IP detectada en el arranque
            if (lastDetectedPrinterIP) {
                console.log(`📡 Usando impresora de red en caché: ${lastDetectedPrinterIP}`);
                // Aquí llamarías a tu función printLAN anterior si fuera necesario
            } else {
                console.error("❌ No hay impresoras en caché ni instaladas.");
            }
        }
    } catch (e) {
        console.error('Error crítico:', e.message);
    } finally {
        if (!tempWindow.isDestroyed()) tempWindow.destroy();
    }
}


// --- IPC HANDLERS ---
// En tu main.js o archivo de Electron
ipcMain.handle('find-network-printers', async (event) => {
    // Esta función ya devuelve una Promesa gracias a 'async'
    const foundPrinters = await scanNetworkForPrinters();
    return foundPrinters; // Electron envía esto de vuelta al frontend automáticamente
});
ipcMain.handle('get-system-printers', async () => {
    return await getAvailablePrinterList();
});
ipcMain.on('set-printer-ip', (e, ip) => { lastDetectedPrinterIP = ip; });
ipcMain.on('print-receipt', (e, html) => executeSmartPrint(html, "Factura"));
ipcMain.on('print-test', (e, html) => executeSmartPrint(html, "Test"));
ipcMain.on('print-order', (e, html) => executeSmartPrint(html, "Orden"));

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1200, height: 800,
        webPreferences: { nodeIntegration: true, contextIsolation: false }
    });
    //mainWindow.loadURL('http://localhost:5173/SGA_management/123/f62e9cc238ebfeba80e67d22/new');
    mainWindow.loadURL('https://sga-facturation.onrender.com');
}

app.whenReady().then(async () => {
    createWindow();
    
    // Ejecutamos el escaneo inicial después de que la ventana esté lista
    mainWindow.webContents.once('did-finish-load', () => {
        initializePrinters();
    });

    if (!isDev) {
        autoUpdater.checkForUpdatesAndNotify();
    }
});