
import { useEffect, useState } from 'react';
import './LoadingAppDataPage.css'
import { useAppInfo } from '../../../context/context';

export function LoadingAppDataPage({title}){

    const {appInfo,darkMode,setDarkMode} = useAppInfo();

    useEffect(()=>{
        setDarkMode(window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);
    },[])

    useEffect(() => {
        const root = document.documentElement; // <html>
        if (darkMode) root.classList.add('dark');
        else root.classList.remove('dark');
    }, [darkMode]);

    return(
        <div className="LoadingAppDataPage">
            <img src="https://res.cloudinary.com/djjxugmni/image/upload/v1772826198/Gemini_Generated_Image_fx4nzmfx4nzmfx4n-2_fizk0g.png" />
            <div className="loadingDotsA">
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
            <strong>SGA - Facturación</strong>
        </div>
    )
}