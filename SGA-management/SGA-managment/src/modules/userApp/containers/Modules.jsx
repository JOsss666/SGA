import { useNavigate, Routes, Route } from 'react-router-dom';
import { BoldTitle } from '../components/BoldTitle';
import { ModuleCard } from '../components/ModuleCard';

import './Modules.css';
import { DescriptionSpan } from '../components/DescriptionSpan';

export function Modules(){
    const navigate = useNavigate();

    const modulesData = [
        {
            id: 'administration',
            name: 'Administración',
            description: 'Analiza, gestiona y parametriza los módulos de tu empresa',
            image: 'https://res.cloudinary.com/djjxugmni/image/upload/v1761512639/ChatGPT_Image_26_oct_2025_16_03_39_d7hmbb.png',
            buttons: [
                { text: 'Ajustes', action: 'settings', icon: 'fa-solid fa-gear' },
                { text: 'Administrar', action: 'view', icon: 'fa-solid fa-arrow-right' }
            ]
        },
        {
            id: 'process',
            name: 'Procesos',
            description: 'Analiza, gestiona y parametriza los módulos de tu empresa',
            image: 'https://res.cloudinary.com/djjxugmni/image/upload/v1759181339/ChatGPT_Image_7_sept_2025_13_29_09_v2xl9a.png',
            buttons: [
                { text: 'Ajustes', action: 'settings', icon: 'fa-solid fa-gear' },
                { text: 'Administrar', action: 'view', icon: 'fa-solid fa-arrow-right' }
            ]
        },
        {
            id: 'inventory',
            name: 'Inventarios',
            description: 'Analiza, gestiona y parametriza los módulos de tu empresa',
            image: 'https://res.cloudinary.com/djjxugmni/image/upload/v1759181476/ChatGPT_Image_25_ago_2025_15_43_35_s9jwrf.png',
            buttons: [
                { text: 'Ajustes', action: 'settings', icon: 'fa-solid fa-gear' },
                { text: 'Administrar', action: 'view', icon: 'fa-solid fa-arrow-right' }
            ]
        },
        {
            id: 'accounting',
            name: 'Contabilidad',
            description: 'Analiza, gestiona y parametriza los módulos de tu empresa',
            image: 'https://i.pinimg.com/1200x/99/65/82/996582960c20e3b60a90ca86a74eedd4.jpg',
            buttons: [
                { text: 'Ajustes', action: 'settings', icon: 'fa-solid fa-gear' },
                { text: 'Administrar', action: 'view', icon: 'fa-solid fa-arrow-right' }
            ]
        },
        {
            id: 'billing',
            name: 'Facturación',
            description: 'Analiza, gestiona y parametriza los módulos de tu empresa',
            image: 'https://res.cloudinary.com/djjxugmni/image/upload/v1761582964/ChatGPT_Image_7_sept_2025_16_39_37_pc79hk.png', 
            buttons: [
                { text: 'Ajustes', action: 'settings', icon: 'fa-solid fa-gear' },
                { text: 'Administrar', action: 'view', icon: 'fa-solid fa-arrow-right' }
            ]
        },
        {
            id: 'treasury',
            name: 'Tesorería',
            description: 'Analiza, gestiona y parametriza los módulos de tu empresa',
            image: 'https://i.pinimg.com/1200x/0a/5b/83/0a5b8348a20c7f9e2eb608fd76719ed4.jpg', 
            buttons: [
                { text: 'Ajustes', action: 'settings', icon: 'fa-solid fa-gear' },
                { text: 'Comprar', action: 'buy', icon: 'fa-solid fa-box' }
            ]
        },
        {
            id: 'certicloud',
            name: 'CertiCloud',
            description: 'Analiza, gestiona y parametriza los módulos de tu empresa',
            image: 'https://res.cloudinary.com/djjxugmni/image/upload/v1759160717/logo_certicloud-_perfil_azul_2_ljka0q.png',
            buttons: [
                { text: 'Ajustes', action: 'settings', icon: 'fa-solid fa-gear' },
                { text: 'Comprar', action: 'buy', icon: 'fa-solid fa-box' }
            ]
        },
        {
            id: 'ctools',
            name: 'Ctools',
            description: 'Analiza, gestiona y parametriza los módulos de tu empresa',
            image: 'https://i.pinimg.com/736x/fc/55/78/fc557891f4587e03e4eaaea18a4bc9c3.jpg', 
            buttons: [
                { text: 'Ajustes', action: 'settings', icon: 'fa-solid fa-gear' },
                { text: 'Comprar', action: 'buy', icon: 'fa-solid fa-box' }
            ]
        },
    ];

    const handleCardClick = (moduleId) => {
        navigate(moduleId);
    };

    const handleButtonClick = (e, moduleId, action) => {
        e.stopPropagation();
        
        if (action === 'settings') {
            navigate('ajustes');
        }
        if (action === 'view') {
            navigate(moduleId);
        }
        if (action === 'buy') {
            console.log(`Comprar módulo: ${moduleId}`);
        }
        
    const handleSmallButtonClick = (e, action) => {
        e.stopPropagation();
        //  para botones pequeños
    };
    };

    return(
        <div className="Modules">
            <Routes>
                <Route path='' element={
                    <div className='ModulesMain'>
                        <div className="modules-header">
                            <BoldTitle text={'SGA - Módulos'}/>
                            <DescriptionSpan text={'Analiza, gestiona y parametriza los módulos de tu empresa'}/>
                        </div>
                        
                        <div className="modules-grid">
                            {modulesData.map((module) => (
                                <ModuleCard
                                    key={module.id}
                                    module={module}
                                    onCardClick={handleCardClick}
                                    onButtonClick={handleButtonClick}
                                />
                            ))}
                        </div>
                    </div>
                }/>
                
                <Route path='ajustes' element={
                    <div className="ajustes-page">
                        <BoldTitle text={'Ajustes'} />
                        <div className="ajustes-content">
                        </div>
                    </div>
                }/>
                
                {modulesData.map(module => (
                    <Route 
                        key={module.id} 
                        path={module.id} 
                        element={
                            <div className="module-detail-page">
                                <BoldTitle text={module.name} />
                                <p>{module.description}</p>
                                <div className="module-detail-content">
                                    <div className="module-features">
                                    </div>
                                </div>
                            </div>
                        } 
                    />
                ))}
            </Routes>
        </div>
    );
}