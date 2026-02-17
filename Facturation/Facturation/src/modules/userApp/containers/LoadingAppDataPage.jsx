
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
            <img src="https://res.cloudinary.com/djjxugmni/image/upload/v1759181339/ChatGPT_Image_7_sept_2025_13_29_09_v2xl9a.png" />
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