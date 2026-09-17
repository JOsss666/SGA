export function getAttachmentUrl(file) {
    const url = new URL(file.url);
    if(!['http:', 'https:'].includes(url.protocol)) {
        throw new Error('El enlace del archivo no es válido.');
    }
    return url.href;
}

async function fetchAttachment(file) {
    const response = await fetch(getAttachmentUrl(file), {
        signal: AbortSignal.timeout(60000)
    });
    if(!response.ok) throw new Error('No se pudo descargar el archivo.');
    return response.blob();
}

export async function downloadAttachment(file) {
    const blob = await fetchAttachment(file);
    const objectUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = objectUrl;
    link.download = file.name || `archivo-${file.id}`;
    document.body.appendChild(link);
    try {
        link.click();
    } finally {
        link.remove();
        setTimeout(() => URL.revokeObjectURL(objectUrl), 60000);
    }
    return 'Descarga iniciada. Revisa las descargas de tu navegador.';
}

export async function shareAttachment(file) {
    const url = getAttachmentUrl(file);
    const data = {title: file.name || 'Archivo adjunto', url};
    if(navigator.share && (!navigator.canShare || navigator.canShare(data))) {
        try {
            await navigator.share(data);
            return 'Archivo compartido.';
        } catch(error) {
            if(error.name === 'AbortError') return '';
            throw error;
        }
    }
    if(!navigator.clipboard?.writeText) {
        throw new Error('Este navegador no permite compartir ni copiar el enlace automáticamente.');
    }
    await navigator.clipboard.writeText(url);
    return 'Enlace copiado al portapapeles.';
}

export async function printAttachment(file) {
    if(file.type !== 'application/pdf' && !file.type?.startsWith('image/')) {
        throw new Error('Descarga este archivo y ábrelo en su aplicación para imprimirlo.');
    }
    const blob = await fetchAttachment(file);
    const objectUrl = URL.createObjectURL(blob);
    const frame = document.createElement('iframe');
    frame.className = 'attachmentPrintFrame';
    frame.style.cssText = 'position:fixed;left:-10000px;top:0;width:1px;height:1px;border:0';
    frame.title = 'Impresión de archivo adjunto';
    const cleanup = () => {
        frame.remove();
        URL.revokeObjectURL(objectUrl);
    };
    try {
        await new Promise((resolve, reject) => {
            const timeout = setTimeout(() => reject(new Error('El archivo tardó demasiado en prepararse para imprimir.')), 60000);
            const fail = () => {
                clearTimeout(timeout);
                reject(new Error('No se pudo preparar el archivo para imprimir.'));
            };
            const print = () => {
                clearTimeout(timeout);
                try {
                    frame.contentWindow.addEventListener('afterprint', cleanup, {once: true});
                    frame.contentWindow.focus();
                    frame.contentWindow.print();
                    // Algunos visores PDF no emiten afterprint.
                    setTimeout(cleanup, 300000);
                    resolve();
                } catch {
                    fail();
                }
            };
            frame.onerror = fail;
            frame.onload = () => {
                if(file.type === 'application/pdf') {
                    print();
                    return;
                }
                const printDocument = frame.contentDocument;
                printDocument.title = file.name || 'Archivo adjunto';
                const style = printDocument.createElement('style');
                style.textContent = 'body{margin:0}img{display:block;max-width:100%;max-height:100vh;object-fit:contain}';
                printDocument.head.appendChild(style);
                const image = printDocument.createElement('img');
                image.onload = print;
                image.onerror = fail;
                image.src = objectUrl;
                printDocument.body.appendChild(image);
            };
            frame.src = file.type === 'application/pdf' ? objectUrl : 'about:blank';
            document.body.appendChild(frame);
        });
    } catch(error) {
        cleanup();
        throw error;
    }
    return 'Impresión solicitada. Si el visor PDF no abre el diálogo, abre el archivo en una nueva pestaña e imprime desde allí.';
}
