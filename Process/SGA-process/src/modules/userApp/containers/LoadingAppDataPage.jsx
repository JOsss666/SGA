
import { useEffect } from 'react';
import './LoadingAppDataPage.css'
import { useAppInfo } from '../../../context/context';

export function LoadingAppDataPage({title}){
    const {darkMode} = useAppInfo();

    useEffect(() => {
        const root = document.documentElement;
        if (darkMode) root.classList.add('dark');
        else root.classList.remove('dark');
    }, [darkMode]);

    return(
        <div className="LoadingAppDataPage" role="status" aria-live="polite" aria-busy="true">
            <img src="https://cdnmain.sga360.co/static/Gemini_Generated_Image_fx4nzmfx4nzmfx4n-2_fizk0g.webp" alt="SGA360" />
            <div className="loadingDotsA" aria-hidden="true">
                <div className="loadingDot"></div>
                <div className="loadingDot"></div>
                <div className="loadingDot"></div>
                <div className="loadingDot"></div>
                <div className="loadingDot"></div>
                <div className="loadingDot"></div>
                <div className="loadingDot"></div>
                <div className="loadingDot"></div>
            </div>
            <h6>{title? title:'Cargando el contenido de su aplicación...'}</h6>
            <strong>SGA - Procesos</strong>
        </div>
    )
}
