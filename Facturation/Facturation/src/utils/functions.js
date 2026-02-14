
import { urlSer } from "../App";
import Papa from 'papaparse';
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import QRCode from 'qrcode';

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

export function parseToXlsx(info, download, columns, name) {
    // Crear hoja
    let worksheet;

    if (columns && Array.isArray(columns)) {
        // Formato con columnas definidas
        const rows = info.map(row => {
            const obj = {};
            columns.forEach(col => {
                obj[col.header] = row[col.key];
            });
            return obj;
        });
        worksheet = XLSX.utils.json_to_sheet(rows);
    } else {
        // Inferir columnas automáticamente
        worksheet = XLSX.utils.json_to_sheet(info);
    }

    // Crear libro
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, name || "Hoja1");

    // Generar archivo excel
    const wbout = XLSX.write(workbook, { bookType: "xlsx", type: "array" });

    const blob = new Blob([wbout], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    });

    if (download) {
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = (name || "archivo") + ".xlsx";
        link.click();
    } else {
        return blob;
    }
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


export function moneyFormat(number){
    if(number != undefined){
        let testN = number>0 ? number:number * -1
        let n = JSON.stringify(testN);
        let data = ''
        let counter = 1;
        for(let i = n.length -1;i >= 0;i--){
            if(n[i] != '.'){
                data += n[i];
                if(counter%3 == 0 && i != 0){
                    data += '.'
                }
                counter ++;
            }
            if(n[i] == '.'){
                data += ','
                counter = 1;
            }
        }
        let x = '';
        if(number < 0){
            x += '- '
        }
        for(let i = data.length -1;i >= 0;i--){
            x += data[i];
        }
        return(x)
    }else{
        return('0')
    }
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

export async function printCashRecipt(info,appInfo){
    console.log(info);
    if (!window.require) {
        alert("Esta función solo está disponible en la App de Escritorio.");
    }
    const qrUrl = await QRCode.toDataURL(`https://facturation.sga360.co/preview/${appInfo.company_key}/${info.doc_id}`);
    let procesqrUrl;
    if(info.instance_id != undefined){
        procesqrUrl= await QRCode.toDataURL(`https://facturation.sga360.co/preview/${appInfo.company_key}/340`)
    }
    const { ipcRenderer } = window.require('electron');

    const contenidoHTML = `
        <div style="
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
                Z&J S.A.S
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
                Tercero: José Murillo
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

            ${info.instance_id != undefined && `
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
                        Orden de trabajo #${info.instance_id}
                    </h3>
                </div>
    
            `}

        </div>
    `;

    ipcRenderer.send('print-receipt', contenidoHTML);
}

