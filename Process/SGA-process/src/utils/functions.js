
import { urlSer } from "../App";
import domtoimage from "dom-to-image-more";
import Papa from 'papaparse';
import ExcelJs from 'exceljs';

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

import ExcelJS from "exceljs";

export async function parseToXlsx(info, download, columns, name) {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(name || "Hoja 1");
    if (columns && Array.isArray(columns)) {
        worksheet.columns = columns;
        worksheet.addRows(info);
    } else {
        // Si no hay columnas, inferir encabezados automáticamente
        if (info.length > 0 && typeof info[0] === "object") {
        const headers = Object.keys(info[0]);
        worksheet.addRow(headers);
        info.forEach(obj => worksheet.addRow(Object.values(obj)));
        } else {
        worksheet.addRows(info);
        }
    }
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", name ? `${name}.xlsx` : "descarga.xlsx");
    if (download) {
        link.click();
    } else {
        return link;
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


export function copyToClipBoard(text){
    navigator.clipboard.writeText(text)
    .catch(err => {
        console.error('Error al copiar:', err);
    });
}


export function moneyFormat(number){
    if(number != undefined){
        let n = JSON.stringify(number);
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