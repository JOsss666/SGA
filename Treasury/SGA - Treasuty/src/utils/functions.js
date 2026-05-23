
import { urlSer } from "../App";
import Papa from 'papaparse';
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import QRCode from 'qrcode';
import JsBarcode from 'jsbarcode';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

export async function postInfo(route,informacion){
    console.log('Funcion post');
    return new Promise((resolve, reject) => {
        console.log(urlSer+route)
        fetch(urlSer + route ,{
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(informacion)
        })
        .then(response =>{
            if(response.ok == false){
                return response.json().then(err => {
                    reject(err);
                });
            }
            return response.json()
        })
        .then(data=>{
            resolve(data)
        })
    })
}

export async function getInfo(route) {
    console.log('Funcion get');
    return new Promise((resolve, reject) => {
        console.log(urlSer + route);
        
        fetch(urlSer + route, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        })
        .then(response => {
            if (response.ok === false) {
                // Manejo de errores (404, 500, etc)
                return response.json().then(err => {
                    reject(err);
                });
            }
            return response.json();
        })
        .then(data => {
            resolve(data);
        })
        .catch(error => {
            // Manejo de errores de red o conexión
            reject(error);
        });
    });
}

export async function parseToXlsx(info = [], download, columns, name, options = {}) {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(name || "Hoja1");

    const normalizedColumns = columns && Array.isArray(columns)
        ? columns.map(col => typeof col === "string" ? { header: col, key: col } : col)
        : Object.keys(info[0] || {}).map(key => ({ header: key, key }));

    const columnKeys = normalizedColumns.map(col => col.key);
    const tableStartRow = options.startRow || 5;
    const reportColumnCount = Math.max(normalizedColumns.length, 4);

    // 1. Añadir Título y Metadatos (Filas superiores)
    worksheet.mergeCells(1, 1, 1, reportColumnCount);
    const titleCell = worksheet.getCell('A1');
    titleCell.value = options.companyName || (name || "Informe SGA").toUpperCase();
    titleCell.font = { size: 16, bold: true };

    worksheet.getCell('A2').value = `Fecha de generación: ${new Date().toLocaleString()}`;
    worksheet.getCell('A3').value = `Total de registros: ${info.length}`;
    
    // Espacio antes de la tabla
    const startRow = tableStartRow;

    if (options.companyName || options.reportName || options.period) {
        worksheet.getCell('A2').value = options.reportName || name || "Informe SGA";
        worksheet.getCell('A3').value = options.period ? `Periodo: ${options.period}` : "";
    }

    // 2. Definir Columnas
    worksheet.getRow(startRow).values = normalizedColumns.map(col => col.header);

    // 3. Estilizar el Encabezado (Color de fondo y texto)
    const headerRow = worksheet.getRow(startRow);
    headerRow.eachCell((cell) => {
        cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: '262626' }
        };
        cell.font = { color: { argb: 'FFFFFF' }, bold: true };
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
    });

    // 4. Añadir los Datos
    info.forEach((item) => {
        const rowData = columnKeys.map((key, index) => {
            const value = item[key];
            if (normalizedColumns[index]?.type === "number" && value !== null && value !== undefined && value !== "") {
                const numericValue = Number(value);
                return Number.isNaN(numericValue) ? value : numericValue;
            }
            return value;
        });
        const row = worksheet.addRow(rowData);
        row.eachCell((cell, colNumber) => {
            const columnConfig = normalizedColumns[colNumber - 1];
            if (columnConfig?.numFmt) {
                cell.numFmt = columnConfig.numFmt;
                cell.alignment = { horizontal: 'right' };
            }
        });
    });

    // 5. Ajustar ancho de columnas automáticamente
    worksheet.columns.forEach((column, index) => {
        column.width = normalizedColumns[index]?.width || 20;
    });

    // 6. Generar el archivo
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });

    if (download) {
        saveAs(blob, `${name || "archivo"}.xlsx`);
    } else {
        return blob;
    }
}

export async function parseCashBoxeToXlsx(data,title) {

    console.log(data)

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Resumen de Cierre');

    // 1. Encabezado General del Reporte
    worksheet.mergeCells('A1:F1');
    const mainTitle = worksheet.getCell('A1');
    mainTitle.value = ` - ${title}`;
    mainTitle.font = { size: 16, bold: true, color: { argb: 'FFFFFFFF' } };
    mainTitle.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '262626' } };
    mainTitle.alignment = { horizontal: 'center' };

    worksheet.getCell('A2').value = `Generado el: ${new Date().toLocaleString()}`;
    
    let currentRow = 4;

    // 2. Iterar por cada Método de Pago
    data.forEach((group) => {
        // Título de la Sección (Método de Pago)
        worksheet.mergeCells(`A${currentRow}:F${currentRow}`);
        const methodCell = worksheet.getCell(`A${currentRow}`);
        methodCell.value = group.paymentMethod_name.toUpperCase();
        methodCell.font = { bold: true, size: 12 };
        methodCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'E5E5E5' } };
        
        currentRow++;

        // Encabezados de la tabla de transacciones
        const headers = ['Instancia', 'Documento', 'Concepto', 'Tercero', 'Sub-total', 'Total','Fecha','Documento electronico'];
        const headerRow = worksheet.getRow(currentRow);
        headerRow.values = headers;
        headerRow.font = { bold: true };
        headerRow.eachCell(cell => {
            cell.border = { bottom: { style: 'thin' } };
        });

        currentRow++;

        let subtotalMetodo = 0;

        // 3. Insertar Transacciones del método
        group.attached_trs?.forEach(trans => {
            const row = worksheet.addRow([
                trans.instance_serial? `${trans.process_code}#${trans.instance_serial}` : '---',
                trans.doc_type || '---',
                trans.concept_name || '---',
                trans.thirdparty_name || '---',
                trans.subTotal || '---',
                trans.total || 0,
                trans.created_at || '---',
                trans.e_doc_number || '---'
            ]);
            
            // Formato de moneda para la columna Total (F)
            row.getCell(6).numFmt = '"$"#,##0';
            subtotalMetodo += (trans.amount || 0);
            currentRow++;
        });

        // 4. Fila de Subtotal por método
        const totalRow = worksheet.getRow(currentRow);
        totalRow.getCell(5).value = `Total ${group.paymentMethod_name}:`;
        totalRow.getCell(5).font = { bold: true };
        totalRow.getCell(6).value = group.net_balance;
        totalRow.getCell(6).font = { bold: true };
        totalRow.getCell(6).numFmt = '"$"#,##0';

        currentRow += 2; // Espacio entre secciones
    });

    // Ajustar anchos de columna
    worksheet.columns = [
        { width: 15 }, // ID
        { width: 15 }, // Tipo
        { width: 35 }, // Descripción
        { width: 25 }, // Cliente
        { width: 20 }, // Fecha
        { width: 15 }, // Total
    ];

    // 5. Descarga
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    saveAs(blob, `${name}_${new Date().getTime()}.xlsx`);
}

export  async function parseToCsv(info,download,name){
    const newCsv = Papa.unparse(info);
    const blob = new Blob([newCsv],{type:"text/csv;charset=utf-8;"})
    let blobUrl = URL.createObjectURL(blob)
    let newLinkDownload = document.createElement("a");
    newLinkDownload.href = blobUrl;
    newLinkDownload.setAttribute("download",name? name:"SGA - descarga.csv");
    if(download){
        newLinkDownload.click();
    }else{
        return newLinkDownload;
    }
}

export async function componentToPdf(component,download = true,options = {},name = "SGA-descarga.pdf") {
    const { title = "", scale = 2 } = options;

    // Asegurar que todas las imágenes dentro del componente estén cargadas
    await Promise.all(
        Array.from(component.getElementsByTagName("img")).map((img) => {
        if (img.complete) return Promise.resolve();
        return new Promise((resolve) => {
            img.onload = resolve;
            img.onerror = resolve;
        });
        })
    );

    // Guardar estilos originales
    const originalOverflow = component.style.overflow;
    const originalHeight = component.style.height;

    // Expandir el componente para capturar todo (en caso de scroll)
    component.style.overflow = "visible";
    component.style.height = "auto";

    // Capturar el contenido
    const canvas = await html2canvas(component, {
        scale,
        useCORS: true,
        scrollY: 0,
        logging: false,
        backgroundColor: "#ffffff",
    });

    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF("p", "mm", "a4");

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const imgWidth = pageWidth;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    let heightLeft = imgHeight;
    let position = 0;

    // Si hay título, lo añadimos al inicio
    if (title) {
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(16);
        const textWidth = pdf.getTextWidth(title);
        pdf.text(title, (pageWidth - textWidth) / 2, 15); // centrado
        position = 25; // espacio para el título
    }

    // Añadir imagen (primera página)
    pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    // Agregar páginas adicionales si es necesario
    while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
    }

    // Restaurar estilos originales
    component.style.overflow = originalOverflow;
    component.style.height = originalHeight;

    // Descargar o retornar el PDF
    if (download) {
        pdf.save(name);
    } else {
        return pdf;
    }
}


export function copyToClipBoard(text){
    navigator.clipboard.writeText(text)
    .catch(err => {
        console.error('Error al copiar:', err);
    });
}


export function moneyFormat(value){
  // Manejo de undefined, null o valores no numéricos
    if (value === undefined || value === null || isNaN(value) || value === '') {
        return '0'; // O puedes retornar 'N/A' según tu preferencia
    }

    // Usamos Intl.NumberFormat para máxima eficiencia
    // 'de-DE' usa el punto como separador de miles
    return new Intl.NumberFormat('de-DE').format(value);

}

export const formatDate = (date,noHour)=>{
        if(date != undefined){
            let x = date.split('T');
            let newDate = `${x[0]}`;
            if(!noHour){
                newDate += ` ${x[1].substring(0,5)}`
            }
            return newDate;
        }
        return `--/--/--`
    }

export async function uploadFileInChunks(file,setAdvancePercent){
    
    const chunkSize = 5 * 1024 * 1024; // 5MB
    const totalChunks = Math.ceil(file.size / chunkSize);
    const fileId = `${Date.now()}-${file.name}`;

    for (let index = 0; index < totalChunks; index++) {
        const start = index * chunkSize;
        const end = Math.min(start + chunkSize, file.size);
        const chunk = file.slice(start, end);

        const formData = new FormData();
        formData.append("chunk", chunk);
        formData.append("fileId", fileId);
        formData.append("chunkIndex", index);
        formData.append("totalChunks", totalChunks);
        formData.append("fileName", file.name);

        const res = await fetch("http://localhost:3000/upload-chunk", {
        method: "POST",
        body: formData,
        });

        if (!res.ok) throw new Error(`Error subiendo chunk ${index + 1}`);
        console.log(`✅ Chunk ${index + 1}/${totalChunks} subido`);
    }

    // Avisar al servidor que ya se subieron todos
    const finalizeRes = await fetch("http://localhost:3000/merge-chunks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileId, fileName: file.name }),
    });

    return await finalizeRes.json();
}


export async function getAttached(type,attached,paramsDB) {

    const dictionatyRoutes = {
        'reportOPS':'/process/getOp',
        'reportOCS':'/process/getDocuments',
        'reportDCS':'/process/getDocuments',
        'reportFVS':'/process/getDocuments',
        'reportCIS':'/process/getDocuments'
    }
    
    async function getFromDataBase(){
        let typeDoc = (attached.split('report')[1]).substring(0,2);
        paramsDB.type = typeDoc
        let res = await postInfo(dictionatyRoutes[attached],paramsDB);
        if(res[0]){
            return({
                [attached]:res[1]
            })
        }
    }

    switch (type){
        case 'report':
            return(await getFromDataBase())
        case 'analytics':
            return(await getFromDataBase())
        case 'report':
            return(await getFromDataBase())
    }

}


export async function ScreenShotElement(elemet,name){
    domtoimage.toPng(elemet)
    .then((dataUrl) => {
        const link = document.createElement('a');
        link.download = name != undefined? name:'captura.png';
        link.href = dataUrl;
        link.click();
    })
    .catch((error) => {
        console.error('Error al generar la imagen:', error);
    });
}


export const uploadFiles = async (files,info) => {
    console.log(info)
    if (!files || files.length === 0) {
        throw new Error("Debe proporcionar al menos un archivo.");
    }

    const formData = new FormData();
    formData.append('info', JSON.stringify(info));
    // Append de varios archivos
    for (let i = 0; i < files.length; i++) {
        formData.append("files", files[i]); // CORRECTO
    }

    try {
        const respuesta = await fetch(urlSer + "/uploadFiles", {
            method: "POST",
            body: formData,
        });

        if (!respuesta.ok) {
            const errorData = await respuesta.json().catch(() => ({}));
            throw new Error(errorData.mensaje || `Error HTTP: ${respuesta.status}`);
        }
        // Espacio para insertar el adunto en la base de datos

        return await respuesta.json();

    } catch (error) {
        console.error("Error al subir los archivos:", error.message);
        throw error;
    }
};


export const arrayToTree = (flatArray, rootIdValue = null) => {
    // 1. Crear un mapa (Hash Map) de todos los nodos por su ID
    const nodes = {};
    flatArray.forEach(item => {
        let O = item;
        O.children = [];
        nodes[item.id] = O;
    });

    const tree = [];

    Object.values(nodes).forEach(node => {
        const parentId = node.parent_id;
        
        // Si el nodo tiene un padre (y el padre existe en el mapa)
        if (parentId !== rootIdValue && nodes[parentId]) {
            // Añade este nodo al array 'children' de su padre
            nodes[parentId].children.push(node);
        } else {
            // Si es un nodo raíz (parent_id es null o el valor de rootIdValue), 
            // añádelo directamente al array principal del árbol
            tree.push(node);
        }
    });
    
    // Opcional: Ordenar los nodos raíz y los hijos alfabéticamente
    // Esto se recomienda si la consulta SQL no garantiza el orden alfabético
    const sortTree = (arr) => {
        arr.sort((a, b) => a.name.localeCompare(b.name));
        arr.forEach(node => {
            if (node.children.length > 0) {
                sortTree(node.children);
            }
        });
    }
    sortTree(tree);

    return tree;
};

export async function newElectronicInvoide(info){
    let res = await postInfo('/electronicFacturation/invoice',info);
    return(res)
}

export async function newElectronicNote(info){
    let res = await postInfo('/electronicFacturation/note',info);
    return(res)
}

export async function getNumberingRangesElectronicInvoices() {
    let res = await getInfo('/electronicFacturation/getNumberingRanges');
    console.log(res);
}

export async function showActualToken() {
    let res = await getInfo('/electronicFacturation/showActualToken');
    console.log(res);
}

export async function showAPITaxes() {
    let res = await getInfo('/electronicFacturation/taxes');
    console.log(res);
}







// funciones para impresion

export async function printCashRecipt(info,appInfo,barCode){
    console.log(info);

    function generateBarcodeSVG(value) {
        const svgNode = document.createElementNS("http://www.w3.org/2000/svg", "svg");

        JsBarcode(svgNode, value, {
            format: "CODE128",
            width: 2,
            height: 60,
            displayValue: false,
            margin: 0
        });

        return svgNode.outerHTML;
    }

    if (!window.require) {
        alert("Esta función solo está disponible en la App de Escritorio.");
    }
    const qrUrl = await QRCode.toDataURL(`https://facturation.sga360.co/preview/Document/${appInfo.company_key}/${info.doc_id}`)
    const expeditionDate = new Date().toLocaleString();
    let procesqrUrl;
    if(info.instance_id != undefined){
        procesqrUrl= await QRCode.toDataURL(`https://facturation.sga360.co/preview/Process/${appInfo.company_key}/${info.instance_id}`)
    }
    const internalProcessCodeBar = generateBarcodeSVG(`1026n${info.instance_id}`)
    const { ipcRenderer } = window.require('electron');

    const contenidoHTML = `
        <div id="clientOrderContainer" style="
            margin:0;
            width:72mm;
            display:flex;
            flex-direction:column;
            box-sizing:border-box;
            padding:2mm;
            font-family:sans-serif;
        ">
            <div style="
                display:flex;
                justify-content:center;
                margin-bottom:4mm;
                padding:2mm;
            ">
                <img 
                    src="${qrUrl}" 
                    style="width:32mm;height:32mm;"
                />
            </div>

            <h1 style="
                font-size:16px;
                text-align:center;
                margin:0;
            ">
                ${appInfo.legal_name}
            </h1>
            <h3 style="
                font-size:14px;
                font-family:monospace;
                margin:0;
            ">
                ${info.doc_type}#${info.ownSerial}
            </h3>

            <span style="font-size:12px;">
                Concepto: Servicio de impresión digital
            </span>

            <span style="font-size:12px;">
                Tercero: ${info.thirdParty_name}
            </span>

            <span style="font-size:12px;">
                Fecha de generación: ${expeditionDate}
            </span>

            <span style="
                margin:2mm 0;
                width:100%;
                border-bottom:dashed .5mm #000;
                display:block;
            "></span>

            <div style="
                display:flex;
                flex-direction:column;
                padding:1mm;
                gap:.5mm;
            ">
                ${info.paymentMethod.map((element)=>{
                return(`
                    <div style="display:flex;font-size:12px;">
                        <span style="
                            display:inline-block;
                            max-width:50%;
                            white-space:nowrap;
                            overflow:hidden;
                            text-overflow:ellipsis;
                        ">
                            ${element.name}:
                        </span>
                        <strong style="margin-left:auto;">
                            ${Number(element.value).toLocaleString()}
                        </strong>
                    </div>
                `)
            }).join('')}
            </div>

            <span style="
                margin:2mm 0;
                width:100%;
                border-bottom:dashed .5mm #000;
                display:block;
            "></span>

            <div style="display:flex;font-size:12px;">
                <span>TOTAL:</span>
                <strong style="margin-left:auto;">${Number(info.total).toLocaleString()}</strong>
            </div>

            <span style="
                margin:2mm 0;
                width:100%;
                border-bottom:dashed .5mm #000;
                display:block;
            "></span>

            <span style="font-size:12px;">
                Nota:  ${info.description}
            </span>

            <span style="
                margin-top:8mm;
                width:100%;
                border-bottom:solid .2mm #000;
                display:block;
            "></span>

            ${info.instance_id != undefined ? `
                <div style="
                    display:flex;
                    flex-direction:column;
                    justify-content:center;
                    margin-bottom:4mm;
                    padding:4mm 2mm;
                ">
                    <img 
                        src="${procesqrUrl}" 
                        style="width:32mm;height:32mm;margin:2mm auto;"
                    />

                    <h3 style="
                        font-size:14px;
                        font-family:monospace;
                        text-align:center;
                        margin-top:2mm;
                    ">
                        Orden de trabajo #${info.instanceOwnSerial}
                    </h3>
                    <span style="font-size:12px;text-align:center;">
                        Consulte el estado de su proceso en tiempo real.
                    </span>
                </div>
            `:``}
            ${barCode? `
                <div style="
                    margin:0 auto;
                    display:flex;
                    width:50mm;
                ">
                    <div style="
                        width:20mm;
                        height:10mm,
                        margin:0 auto;
                    ">
                        ${internalProcessCodeBar}
                    </div> 
                </div>
            `:`
                <div style="
                    width:100%;
                    padding:4mm;
                    box-sizing:border-box;
                    display:flex;
                    align-items:center;
                    gap:4mm;
                ">
                    <div style="
                            width:22mm;
                            display:flex;
                            borderRadius:4mm;
                            border:solid 1mm #ddd;
                            align-items:flex-end;
                            justify-content:center;
                            gap:4mm;
                        ">
                            <img 
                                src="https://res.cloudinary.com/djjxugmni/image/upload/v1761582964/ChatGPT_Image_7_sept_2025_16_39_37_pc79hk.png"
                                style="
                                    width:100%;
                                    height:25mm;
                                    objectFit:cover;
                                    display:block;"/>
                        </div>
                        <div style="
                            flex:1;
                            display:flex;
                            flex-direction:column;
                            justify-content:center;
                        ">
                            <span style="
                                font-size:16px;
                                font-weight:bold;
                                line-height:1.1;
                            ">SGA 360°</span>
                            <span style="
                                font-size:13px;
                                margin-top:1mm;
                            ">SGA Desarrollos.</span>
                            <span style="
                                font-size:12px;
                                margin-top:2mm;
                            ">Tel: 321 4221021</span>
                            <span style="font-size:12px;">www.sga360.co</span>
                        </div>
                    </div>
            `}
        </div>
    `;
    ipcRenderer.send('print-receipt', contenidoHTML);
}

export async function printClientOrder(info,appInfo,barCode){
    console.log(info);

    function generateBarcodeSVG(value) {
        const svgNode = document.createElementNS("http://www.w3.org/2000/svg", "svg");

        JsBarcode(svgNode, value, {
            format: "CODE128",
            width: 2,
            height: 60,
            displayValue: false,
            margin: 0
        });

        return svgNode.outerHTML;
    }

    if (!window.require) {
        alert("Esta función solo está disponible en la App de Escritorio.");
    }
    const expeditionDate = new Date().toLocaleString();
    const qrUrl = await QRCode.toDataURL(`https://facturation.sga360.co/preview/Document/${appInfo.company_key}/${info.doc_id}`)
    let procesqrUrl;
    if(info.instance_id != undefined){
        procesqrUrl= await QRCode.toDataURL(`https://facturation.sga360.co/preview/Process/${appInfo.company_key}/${info.instance_id}`)
    }
    const internalProcessCodeBar = generateBarcodeSVG(`1026n${info.instance_id}`)
    const { ipcRenderer } = window.require('electron');

    const contenidoHTML = `
        <div style="
            margin:0;
            width:72mm;
            display:flex;
            flex-direction:column;
            box-sizing:border-box;
            background:#fff;
            height:fit-content;
            padding:2mm;
            font-family:sans-serif;
        ">
            <div style="
                display:flex;
                justify-content:center;
                margin-bottom:4mm;
                padding:2mm;
            ">
                <img 
                    src="${qrUrl}" 
                    style="width:32mm;height:32mm;"
                />
            </div>

            <h1 style="
                font-size:16px;
                text-align:center;
                margin:0;
            ">
                ${appInfo.legal_name}
            </h1>
            <h3 style="
                font-size:14px;
                font-family:monospace;
                margin:0;
            ">
                ${info.doc_type}#${info.ownSerial}
            </h3>

            <span style="font-size:12px;">
                Concepto: Servicio de impresión digital
            </span>

            <span style="font-size:12px;">
                Tercero: ${info.thirdParty_name}
            </span>

            <span style="font-size:12px;">
                Fecha de generación: ${expeditionDate}
            </span>

            <span style="
                margin:2mm 0;
                width:100%;
                border-bottom:dashed .5mm #000;
                display:block;
            "></span>

            <div style="display: flex; border: solid 0.5mm #000; padding: 1mm; font-size: 10px; font-weight: bold; margin-bottom: 3mm;">
                <span style="width: 50%;">Item</span>
                <span style="width: 20%; text-align: center;">Unidades</span>
                <span style="width: 30%; text-align: right;">Valor</span>
            </div>

            <div style="display: flex; flex-direction: column; padding: 1mm;">
                ${info.services.map((element) => {
                    return `
                        <div style="display: flex; font-size: 10px; border-bottom: dashed 0.3mm #000; padding-top: 1mm; padding-bottom: 2mm; margin-bottom: 1mm; align-items: center;">
                            <span style="width: 50%; line-height: 1.2;">${element.name}</span>
                            <span style="width: 20%; text-align: center;">${element.units}</span>
                            <strong style="width: 30%; text-align: right;">
                                ${moneyFormat(parseFloat(element.value))}
                            </strong>
                        </div>
                    `;
                }).join('')}
            </div>

            <div style="display:flex;fontSize:10px;marginTop:2mm;">
                <span>TOTAL:</span>
                <strong style="margin-left:auto;">${Number(info.total).toLocaleString()}</strong>
            </div>

            <span style="
                margin:2mm 0;
                width:100%;
                border-bottom:dashed .5mm #000;
                display:block;
            "></span>

            <span style="font-size:12px;">
                Nota:  ${info.description}
            </span>

            <span style="
                margin-top:8mm;
                width:100%;
                border-bottom:solid .2mm #000;
                display:block;
            "></span>

            ${info.instance_id != undefined ? `
                <div style="
                    display:flex;
                    flex-direction:column;
                    justify-content:center;
                    margin-bottom:4mm;
                    padding:4mm 2mm;
                ">
                    <img 
                        src="${procesqrUrl}" 
                        style="width:32mm;height:32mm;margin:2mm auto;"
                    />

                    <h3 style="
                        font-size:14px;
                        font-family:monospace;
                        text-align:center;
                        margin-top:2mm;
                    ">
                        Orden de trabajo #${info.instanceOwnSerial}
                    </h3>
                    <h3 style="
                        font-size:10px;
                        font-family:monospace;
                        text-align:center;
                        margin-top:2mm;
                    ">
                        Con este código QR consulta el estado en tiempo real de tu proceso.
                    </h3>
                </div>
    
            `:``}
            ${barCode? `
                <div style="
                    margin:0 auto;
                    display:flex;
                    width:50mm;
                ">
                    <div style="
                        width:20mm;
                        height:10mm,
                        margin:0 auto;
                    ">
                        ${internalProcessCodeBar}
                    </div> 
                </div>
            `:`
                <div style="
                    width:100%;
                    padding:4mm;
                    box-sizing:border-box;
                    display:flex;
                    align-items:center;
                    gap:4mm;
                ">
                    <div style="
                            width:22mm;
                            display:flex;
                            borderRadius:4mm;
                            border:solid 1mm #ddd;
                            align-items:flex-end;
                            justify-content:center;
                            gap:4mm;
                        ">
                            <img 
                                src="https://res.cloudinary.com/djjxugmni/image/upload/v1761582964/ChatGPT_Image_7_sept_2025_16_39_37_pc79hk.png"
                                style="
                                    width:100%;
                                    height:25mm;
                                    objectFit:cover;
                                    display:block;"/>
                        </div>
                        <div style="
                            flex:1;
                            display:flex;
                            flex-direction:column;
                            justify-content:center;
                        ">
                            <span style="
                                font-size:16px;
                                font-weight:bold;
                                line-height:1.1;
                            ">SGA 360°</span>
                            <span style="
                                font-size:13px;
                                margin-top:1mm;
                            ">SGA Desarrollos.</span>
                            <span style="
                                font-size:12px;
                                margin-top:2mm;
                            ">Tel: 321 4221021</span>
                            <span style="font-size:12px;">www.sga360.co</span>
                        </div>
                    </div>
            `}
        </div>
    `;

    ipcRenderer.send('print-receipt', contenidoHTML);
}



export async function printSellInvoice(info,appInfo,barCode){
    console.log(info);
    console.log('Imprimiendo factura de venta...');
    function generateBarcodeSVG(value) {
        const svgNode = document.createElementNS("http://www.w3.org/2000/svg", "svg");

        JsBarcode(svgNode, value, {
            format: "CODE128",
            width: 2,
            height: 60,
            displayValue: false,
            margin: 0
        });

        return svgNode.outerHTML;
    }

    if (!window.require) {
        alert("Esta función solo está disponible en la App de Escritorio.");
    }
    const expeditionDate = new Date().toLocaleString();
    const qrUrl = await QRCode.toDataURL(`https://facturation.sga360.co/preview/Document/${appInfo.company_key}/${info.doc_id}`)
    let procesqrUrl;
    let e_invoiceQe;
    if(info.docInfo.instance_id != undefined){
        procesqrUrl= await QRCode.toDataURL(`https://facturation.sga360.co/preview/Process/${appInfo.company_key}/${info.docInfo.instance_id}`)
    }if(info.electronInfo.id != undefined){
        e_invoiceQe= await QRCode.toDataURL(info.electronInfo.url)
    }
    const internalProcessCodeBar = generateBarcodeSVG(`1026n${info.docInfo.instance_id}`)
    const { ipcRenderer } = window.require('electron');

    const contenidoHTML = `
        <div style="
            margin:0;
            width:72mm;
            display:flex;
            flex-direction:column;
            box-sizing:border-box;
            background:#fff;
            height:fit-content;
            padding:2mm;
            font-family:sans-serif;
        ">
            <div style="
                display:flex;
                justify-content:center;
                margin-bottom:4mm;
                padding:2mm;
            ">
                <img 
                    src="${qrUrl}" 
                    style="width:32mm;height:32mm;"
                />
            </div>

            <h1 style="
                font-size:16px;
                text-align:center;
                margin:0;
            ">
                ${appInfo.legal_name}
            </h1>
            <h3 style="
                font-size:14px;
                font-family:monospace;
                margin:0;
            ">
                ${info.docInfo.doc_type}#${info.docInfo.ownSerial}
            </h3>

            <span style="font-size:12px;">
                Concepto: Servicio de impresión digital
            </span>

            <span style="font-size:12px;">
                Tercero: ${info.thirdPartyInfo.thirdParty_name}
            </span>

            <span style="font-size:12px;">
                Fecha de generación: ${expeditionDate}
            </span>

            <span style="
                margin:2mm 0;
                width:100%;
                border-bottom:dashed .5mm #000;
                display:block;
            "></span>

            <div
                style="
                    width: 100%;
                    fontSize: 10px;
                    marginTop: 2mm;
                    display: flex;
                    flexDirection: column;
                    gap: 1mm
                "
            >
                <table style="
                    width:100%;
                    border-collapse:collapse;
                    table-layout:fixed;
                ">

                    <thead style="
                            border:solid .3mm #000;
                        ">

                        <tr>

                            <th style="
                                text-align:left;
                                width:40%;
                                padding-bottom:1mm;
                                font-size:10px;
                            ">
                                ITEM
                            </th>

                            <th style="
                                text-align:center;
                                width:15%;
                                padding-bottom:1mm;
                                font-size:10px;
                            ">
                                UND
                            </th>

                            <th style="
                                text-align:right;
                                width:20%;
                                padding-bottom:1mm;
                                font-size:10px;
                            ">
                                PRECIO
                            </th>

                            <th style="
                                text-align:right;
                                width:25%;
                                padding-bottom:1mm;
                                font-size:10px;
                            ">
                                TOTAL
                            </th>

                        </tr>

                    </thead>

                    <tbody>

                        ${info.attachedItems.map((item) => {

                            const quantity = Number(item.units || 1);
                            const price = Number(item.unit_value || 0).toFixed(2);
                            const total = Number(parseFloat(item.units) * parseFloat(item.unit_value) || 0).toFixed(2);

                            return `
                                <tr style="
                                    border-bottom:dashed .2mm #ccc;
                                ">

                                    <td style="
                                        padding:1.5mm 0;
                                        font-size:10px;
                                        word-break:break-word;
                                        padding-right:1mm;
                                    ">
                                        ${item.service_name ?? item.name ?? '--'}
                                    </td>

                                    <td style="
                                        text-align:center;
                                        font-size:10px;
                                    ">
                                        ${quantity}
                                    </td>

                                    <td style="
                                        text-align:right;
                                        font-size:10px;
                                        white-space:nowrap;
                                    ">
                                        ${moneyFormat(price)}
                                    </td>

                                    <td style="
                                        text-align:right;
                                        font-size:10px;
                                        font-weight:bold;
                                        white-space:nowrap;
                                    ">
                                        ${moneyFormat(total)}
                                    </td>

                                </tr>
                            `;

                        }).join('')}

                    </tbody>

                </table>
            </div>
            <span style="
                margin:2mm 0;
                width:100%;
                border-bottom:dashed .5mm #000;
                display:block;
            "></span>
             <div style="
                display:flex;
                font-size:12px;
                width:100%;
                margin-bottom:4mm;
            ">

                <span style="
                    margin:auto 0;
                    font-size:12px;
                ">
                    Base impuestos:
                </span>

                <strong style="
                    margin:auto;
                    margin-right:0;
                    text-align:right;
                ">
                    ${moneyFormat(info.docInfo.total - info.totalTaxes)}
                </strong>

            </div>
            <div style="
                display:flex;
                font-size:12px;
            ">
                <div style="
                    display:flex;
                    flex-direction:column;
                    gap:10px 0;
                    width:100%;
                ">

            ${info.taxes.map((element) => {

                return `
                    <div style="
                        maring-top:2mm;
                        display:flex;
                        font-size:12px;
                    ">

                        <span style="
                            margin:auto 0;
                        ">
                            ${element.name} (${element.rate}%):
                        </span>

                        <strong style="
                            margin:auto;
                            margin-right:0;
                        ">
                            ${moneyFormat(element.total)}
                        </strong>

                    </div>
                `;

            }).join('')}

            <div style="
                display:flex;
                font-size:12px;
                width:100%;
            ">

                <span style="
                    margin:auto 0;
                    font-size:12px;
                ">
                    TOTAL:
                </span>
                <strong style="
                    margin:auto;
                    margin-right:0;
                    text-align:right;
                ">
                    ${moneyFormat(info.docInfo.total)}
                </strong>

            </div>
        </div>
        </div>
        <span style="
            margin:2mm 0;
            width:100%;
            border-bottom:dashed .5mm #000;
            display:block;
        "></span>
        <div style="
            display:flex;
            flex-direction:column;
            padding:1mm;
            gap:1mm;
        ">

            ${info.paymentMethods.map((element) => {
                return `
                    <div style="
                        display:flex;
                        font-size:12px;
                    ">

                        <span>
                            ${element.name}:
                        </span>

                        <strong style="
                            margin:auto;
                            margin-right:0;
                        ">
                            ${moneyFormat(element.value)}
                        </strong>

                    </div>
                `;

            }).join('')}
        </div>

    <span style="
        margin:2mm 0;
        width:100%;
        border-bottom:dashed .5mm #000;
        display:block;
    "></span>

            <span style="font-size:12px;">
                Nota:  ${info.docInfo.description?? '--'}
            </span>

            <span style="
                margin-top:8mm;
                width:100%;
                border-bottom:solid .2mm #000;
                display:block;
            "></span>

            ${info.docInfo.instance_id != undefined ? `
                <div style="
                    display:flex;
                    flex-direction:column;
                    justify-content:center;
                    margin-bottom:4mm;
                    padding:4mm 2mm;
                ">
                    <img 
                        src="${procesqrUrl}" 
                        style="width:32mm;height:32mm;margin:2mm auto;"
                    />

                    <h3 style="
                        font-size:14px;
                        font-family:monospace;
                        text-align:center;
                        margin-top:2mm;
                    ">
                        Orden de trabajo #${info.docInfo.instanceOwnSerial}
                    </h3>
                    <h3 style="
                        font-size:10px;
                        font-family:monospace;
                        text-align:center;
                        margin-top:2mm;
                    ">
                        Con este código QR consulta el estado en tiempo real de tu proceso.
                    </h3>
                </div>
    
            `:``}
            ${info.electronInfo.id != undefined ? `
                
                <div style="
                    display:flex;
                    flex-direction:column;
                    justify-content:center;
                    align-items:center;
                    margin-bottom:4mm;
                    padding:2mm;
                    width:100%;
                ">

                    <img 
                        src="${e_invoiceQe}"
                        style="
                            width:34mm;
                            height:34mm;
                        "
                    />

                    <h3 style="
                        font-size:10px;
                        font-family:monospace;
                        text-align:center;
                        margin-top:4mm;
                        width:90%;
                        word-break:break-all;
                        overflow-wrap:break-word;
                        white-space:normal;
                        line-height:1.3;
                    ">
                        CUFE: ${info.electronInfo.code}
                    </h3>

                </div>

            ` : ''}
            ${barCode? `
                <div style="
                    margin:0 auto;
                    display:flex;
                    width:50mm;
                ">
                    <div style="
                        width:20mm;
                        height:10mm,
                        margin:0 auto;
                    ">
                        ${internalProcessCodeBar}
                    </div> 
                </div>
            `:`
                <div style="
                    width:100%;
                    padding:4mm;
                    box-sizing:border-box;
                    display:flex;
                    align-items:center;
                    gap:4mm;
                ">
                    <div style="
                            width:22mm;
                            display:flex;
                            borderRadius:4mm;
                            border:solid 1mm #ddd;
                            align-items:flex-end;
                            justify-content:center;
                            gap:4mm;
                        ">
                            <img 
                                src="https://res.cloudinary.com/djjxugmni/image/upload/v1761582964/ChatGPT_Image_7_sept_2025_16_39_37_pc79hk.png"
                                style="
                                    width:100%;
                                    height:25mm;
                                    objectFit:cover;
                                    display:block;"/>
                        </div>
                        <div style="
                            flex:1;
                            display:flex;
                            flex-direction:column;
                            justify-content:center;
                        ">
                            <span style="
                                font-size:16px;
                                font-weight:bold;
                                line-height:1.1;
                            ">SGA 360°</span>
                            <span style="
                                font-size:13px;
                                margin-top:1mm;
                            ">SGA Desarrollos.</span>
                            <span style="
                                font-size:12px;
                                margin-top:2mm;
                            ">Tel: 321 4221021</span>
                            <span style="font-size:12px;">www.sga360.co</span>
                        </div>
                    </div>
            `}
        </div>
    `;

    ipcRenderer.send('print-receipt', contenidoHTML);
}


export async function scanDevices() {
    const { ipcRenderer } = window.require('electron');
    console.log("Escaneando impresoras de red...");
    
    try {
        // Usamos invoke para llamar al handler asíncrono
        let printers = await ipcRenderer.invoke('get-system-printers');
        console.log("Impresoras encontradas:", printers);
        return printers;
    } catch (error) {
        console.error("Error al escanear:", error);
    }
}
