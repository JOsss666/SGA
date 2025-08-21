import { urlSer } from "../App";

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

export function copyToClipBoard(text){
    navigator.clipboard.writeText(text)
    .catch(err => {
        console.error('Error al copiar:', err);
    });
}


export function moneyFormat(number){
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
}
