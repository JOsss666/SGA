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
// Usa este evento para probar si la impresora reacciona sin basura de código PDF
ipcMain.on('test-print-simple', async () => {
    try {
        const printerName = await getTargetPrinter();
        if (!printerName) return;

        const tempPath = path.join(os.tmpdir(), `test-simple.txt`);
        // Agregamos un caracter de "Form Feed" (\f) al final para forzar el corte/salida
        const content = "HOLA MUNDO\nPRUEBA DIRECTA POS80\nSGA 360\n\f";
        
        fs.writeFileSync(tempPath, content);

        if (process.platform === 'win32') {
            exec(`type "${tempPath}" > "\\\\localhost\\${printerName}"`);
        } else {
            console.log('Usando mac - Forzando modo texto crudo');
            // Usamos 'lpr' en lugar de 'lp' con el parámetro '-l' (literal)
            // Esto evita que CUPS intente filtrar el archivo como documento
            exec(`lpr -P "${printerName}" -l "${tempPath}"`, (error) => {
                if (error) console.error("Error lpr:", error);
            });
        }
    } catch (err) {
        console.error("Error en test:", err);
    }
});

// 3. EVENTO DE IMPRESIÓN PDF (El que ya tenías)
ipcMain.on('print-receipt', async (event, htmlContent) => {
    let tempWindow = new BrowserWindow({ show: false });
    try {
        const printerName = await getTargetPrinter();
        await tempWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(htmlContent)}`);

        const tempPath = path.join(os.tmpdir(), `recibo-${Date.now()}.pdf`);
        const data = await tempWindow.webContents.printToPDF({
            marginsType: 1,
            pageSize: { width: 80000, height: 200000 },
            printBackground: true
        });

        fs.writeFileSync(tempPath, data);

        if (process.platform === 'win32') {
            await ptp.print(tempPath, { printer: printerName, scale: "fit" });
        } else {
            // En Mac para PDF NO USES "-o raw", deja que CUPS procese el PDF
            exec(`lp -d "${printerName}" "${tempPath}"`);
        }
    } catch (e) {
        console.error(e);
    } finally {
        tempWindow.destroy();
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
    mainWindow.loadURL('http://localhost:5173/');
}

app.whenReady().then(createWindow);