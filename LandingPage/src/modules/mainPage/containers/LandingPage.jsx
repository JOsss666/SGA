import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { SgaCard } from '../components/SgaCard';
import './LandingPage.css'
import { useEffect, useState } from 'react';
import { HeadMenuSection } from '../components/HeadMenuSection';
import { PreviewNavigarionPanel } from './PreviewNavigarionPanel';
import { HomePage } from './HomePage';

export function LandingPage() {

    const [actualPath,setActualPath] = useState('/inventarios')
    const [visblePreviewPanel,setVisiblePreviewPanel] = useState(false)

    const menuSections = [
        { title: 'Inventarios', path: '/inventarios' },
        { title: 'Procesos', path: '/procesos' },
        //{ title: 'Compras', path: '/compras' },
        { title: 'Facturación y ventas', path: '/facturacion-y-ventas' },
        { title: 'Tesoreria', path: '/tesoreria' },
        { title: 'Soporte Técnico', path: '/tecnicSupport' },
        { title: 'Contacto', path: '/contacto' },
    ];

    useEffect(() => {
        console.log('actualPath:', actualPath);
    }, [actualPath]);


    useEffect(() => {
        console.log('visblePreviewPanel:', visblePreviewPanel);
    }, [visblePreviewPanel]);

    return (
        <div className="LandingPage">
            <div className="headLandingPage">
                <SgaCard/>
                <div className="optionsHeadMenu" 
                    onMouseOver={()=>{
                        setVisiblePreviewPanel(true);
                    }}
                    onMouseLeave={()=>{
                        setVisiblePreviewPanel(false);
                    }}
                >
                    {menuSections.map((section,index) => (
                        <HeadMenuSection 
                            key={index}
                            title={section.title}
                            path={section.path}
                            action={setActualPath}
                        />
                    ))}
                </div>
                <HeadMenuSection 
                    title={'Iniciar sesión'}
                    path={'/logIn'}
                />
                {visblePreviewPanel && <PreviewNavigarionPanel setVisiblePanel={setVisiblePreviewPanel} path={actualPath}/>}
                <i className="fa-brands fa-sistrix searchMainPage" onClick={()=>{
                    setActualPath('/search')
                    setVisiblePreviewPanel(true);
                }}/>
            </div>
            <div className="mainSpaceLandingPage">
                <Routes>
                    <Route path="/" element={<HomePage/>} />
                </Routes>
            </div>  
        </div>
    );
}