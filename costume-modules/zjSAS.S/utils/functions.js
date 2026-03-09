//export const urlSer = 'http://localhost:3000';
export const urlSer = 'https://sga-2zgp.onrender.com';

export async function postInfo(route,informacion){
    console.log('Funcion post');
    console.log(informacion)
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

export const isToday = (dateToCompare) => {
    if (!dateToCompare) return false;

    const date = new Date(dateToCompare);
    const today = new Date();

    return (
        date.getDate() === today.getDate() &&
        date.getMonth() === today.getMonth() &&
        date.getFullYear() === today.getFullYear()
    );
};

export async function verifiClicksControl(){
    let res = await postInfo('/zj852/getlastClickControl',{});
    if(res[0]){
        let v = true;
        let C = []
        res[1].forEach(element => {
            console.log(element)
            console.log(isToday(element.created_at))
            if(!isToday(element.created_at) && element.clickReuired){
                v = false
                C.push(element.asset_name)
            }
        });
        return([v,C]);
    }else{
        return([false,[]])
    }
}