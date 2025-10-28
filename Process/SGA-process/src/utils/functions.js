
import { urlSer } from "../App";
import domtoimage from "dom-to-image-more";
import Papa from 'papaparse';
import ExcelJs from 'exceljs';
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

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

export async function parseToXlsx(info, download, columns, name) {
    const workbook = new ExcelJs.Workbook();
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


export async function ScreenShotElement(element, name = "captura.png") {
    if (!element) {
        console.error("Elemento no encontrado para capturar.");
        return;
    }

    // Guardar estilos originales
    const originalOverflow = element.style.overflow;
    const originalHeight = element.style.height;

    try {
        // Expandir el elemento para mostrar todo su contenido
        element.style.overflow = "visible";
        element.style.height = "auto";

        // Esperar un pequeño tiempo para que el DOM se actualice visualmente
        await new Promise((resolve) => setTimeout(resolve, 200));

        // Capturar el elemento completo
        const dataUrl = await domtoimage.toPng(element, {
        quality: 1,
        bgcolor: "#ffffff",
        cacheBust: true,
        width: element.scrollWidth,
        height: element.scrollHeight,
        });

        // Crear y activar la descarga
        const link = document.createElement("a");
        link.download = name;
        link.href = dataUrl;
        link.click();

    } catch (error) {
        console.error("Error al generar la imagen:", error);
    } finally {
        // Restaurar estilos originales
        element.style.overflow = originalOverflow;
        element.style.height = originalHeight;
    }
}


//Funciones estadisticas

//media (promedio)
export function media(datos) {
    // Validar si no hay datos
    if (!datos || datos.length === 0) return 0;
        // Recorre los datos sumando cada numero al acumulador
        const suma = datos.reduce((acum, valor) => acum + valor, 0);
    return suma / datos.length;
}


//mediana
export function mediana(datos){
    if (!datos || datos.length === 0)return 0;
    
    //copia de los datos ordenados para no editar el orden original
    const orden = [...datos].sort ((a,b) => a - b);

    const mitad = Math.floor(orden.length / 2)

    //Si es par hacer el promedio de los dos valores del centro
    if(orden.length % 2 === 0){
        return(orden[mitad - 1] + orden[mitad]) / 2;
    } else {
        //Si es impar tomar el valor central
            return orden[mitad];
    }        
}


//moda
export function moda(datos){
    //retornamos datos si no hay moda
    if(!datos || datos.length === 0) return [];

    const frecuencia = {};
    let maxF = 0;
    const modass = []

    //contar frecuencias de cada valor
    datos.forEach(valor => {
        frecuencia[valor] = (frecuencia[valor] || 0) + 1;
        if (frecuencia[valor] > maxF) {
            maxF = frecuencia[valor]
        }
    });

    // Si la frecuencia máxima es 1 y hay más de un elemento, no hay moda
    if (maxF === 1 && datos.length > 1) {
        return [];
    }

    //valores con maxima frecuencia
    Object.keys(frecuencia).forEach(valor => {
        if (frecuencia[valor] === maxF){
            modass.push(Number(valor));
        }
    });
    return modass;
}


//Rango
export function rango(datos) {
    if (!datos || datos.length === 0) return 0;
    
    const max = Math.max(...datos);
    const min = Math.min(...datos);

    return max - min;
}


//definir funcion percentil (metodo 6) 
export function percentil(datos , p){

    //validar si hay datos
    if (!datos || datos.length === 0) return 0;

        //percentil entre 0 y 100
        if (p < 0 || p > 100) throw new error ("percentil entre 0 y 100")
            const orden = [...datos].sort((a,b) => a-b);
            const n = orden.length;

            //metodo 6
            const posicion = (n + 1) * (p / 100);

            if (posicion <= 1) return orden[0];
            if (posicion >= n) return orden[n - 1];
    
            const partEnt = Math.floor(posicion) - 1;
            const partDeci = posicion - Math.floor(posicion);
    
        return orden[partEnt] + partDeci * (orden[partEnt + 1] - orden[partEnt]);
}

//rango
export function ric(datos){
    if (!datos || datos.length === 0) return 0;
    
        const q1 = percentil(datos , 25);
        const q3 = percentil(datos , 75);
    return q1 - q3;
}


//varianza
export function varianza(datos, poblacional = true) {
    if (!datos || datos.length === 0) return 0;
    
        //Si solo hay un elemento, no hay variación
        if (datos.length === 1) return 0;
    
            const promedio = media(datos);
    
            //suma de las diferencias al cuadrado
            const sumCuadrados = datos.reduce((suma, valor) => {
        return suma + Math.pow(valor - promedio, 2);
        }, 0);

    return sumCuadrados / datos.length;
}


//desviacion estandar
export function desviacionEstandar(datos) {
    if (!datos || datos.length === 0) return 0;
    return Math.sqrt(varianza(datos));
}


//coeficiente de variación
export function CoefVari(datos) {
    if (!datos || datos.length === 0) return 0;
        const mediaVal = media(datos);
        if (mediaVal === 0) return 0;
        const desviacion = desviacionEstandar(datos);
    return (desviacion / mediaVal) * 100;
}
