// 1. IMPORTANTE: Agregar ipcMain aquí
import { app, BrowserWindow, ipcMain } from 'electron'; 
import fs from 'fs';
import os from 'os';
import path from 'path';
import { exec } from 'child_process';
import ptp from 'pdf-to-printer';

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

// 2. PRUEBA DE "HOLA MUNDO" (Texto Plano)

ipcMain.on('print-test', async () => {
    let tempWindow = new BrowserWindow({ show: false });

    try {
        console.log('Paso 1');

        await tempWindow.loadURL('about:blank');
        console.log('Paso 2');

        await tempWindow.webContents.executeJavaScript(`
            document.body.innerHTML = "<h1 style='font-size:40px'>HOLA MUNDO</h1>";
        `);

        console.log('Paso 3');

        tempWindow.webContents.print({
            silent: false,   // muestra diálogo para confirmar
            printBackground: true
        });

    } catch (e) {
        console.error('Error:', e);
    }
});


// Usa este evento para probar si la impresora reacciona sin basura de código PDF
ipcMain.on('print-test', async () => {
    let tempWindow = new BrowserWindow({ show: false });

    try {
        console.log('Paso 1');

        await tempWindow.loadURL('about:blank');
        console.log('Paso 2');

        await tempWindow.webContents.executeJavaScript(`
            document.body.innerHTML = "<h1 style='font-size:40px'>SGA Factturation Test</h1>";
        `);

        console.log('Paso 3');

        tempWindow.webContents.print({
            silent: true,
            deviceName: 'POS-80',
            printBackground: true
        }, (success, errorType) => {
            if (!success) {
                console.error('Falló impresión:', errorType);
            } else {
                console.log('Impresión enviada sin diálogo');
            }
        });

    } catch (e) {
        console.error('Error:', e);
    }
});


ipcMain.on('print-receipt', async (event, htmlContent) => {
    let tempWindow = new BrowserWindow({ show: false });

    try {
        console.log('Paso 1');
        const printerName = await getTargetPrinter();
        console.log('Printer:', printerName);
        console.log('Paso 2');

        // Página limpia
        await tempWindow.loadURL('about:blank');

        // Reset total del body + inyección HTML
        await tempWindow.webContents.executeJavaScript(`
            document.body.style.margin = "0";
            document.body.style.padding = "0";
            document.body.style.width = "100%";
            document.body.style.boxSizing = "border-box";
            document.body.innerHTML = \`${htmlContent}\`;
        `);

        console.log('Paso 3');

        if (process.platform === 'win32') {

            tempWindow.webContents.print({
                silent: true,
                deviceName: printerName,
                printBackground: true,
                margins: { marginType: 'none' } // 👈 elimina margen físico
            }, (success, errorType) => {
                if (!success) {
                    console.error('Falló impresión:', errorType);
                } else {
                    console.log('Job enviado sin diálogo');
                }
            });

        } else {
            // Mac/Linux igual que antes
        }

    } catch (e) {
        console.error('Error:', e);
    } finally {
        setTimeout(() => {
            if (!tempWindow.isDestroyed()) tempWindow.destroy();
        }, 2000);
    }
});



function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
        }
    });
    mainWindow.loadURL('http://localhost:5173/SGA_management/123/f62e9cc238ebfeba80e67d22/new');
}

app.whenReady().then(createWindow);