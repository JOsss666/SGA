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

//rango intercuartilico
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

//Z-score
export function zscore(valor, datos) {
    if (!datos || datos.length === 0) return 0;
    const mediaVal = media(datos);
    const desviacion = desviacionEstandar(datos);
    if (desviacion === 0) return 0;
    return (valor - mediaVal) / desviacion;
}

