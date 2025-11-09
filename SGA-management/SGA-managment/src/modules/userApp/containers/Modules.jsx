import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { BoldTitle } from '../components/BoldTitle';
<<<<<<< HEAD


export function Modules(){
=======
import { ModuleCard } from '../components/ModuleCard';
import './Modules.css';

export function Modules(){
    const navigate = useNavigate();

    const modulesData = [
        {
            id: 'administration',
            name: 'Administración',
            description: 'Analiza, gestiona y parametriza los módulos de tu empresa',
            image: '',
            buttons: [
                { text: 'Ajustes', action: 'settings', icon: 'fa-solid fa-gear' },
                { text: 'Ver detalles', action: 'view', icon: 'fa-solid fa-arrow-right' }
            ]
        },
        {
            id: 'process',
            name: 'Procesos',
            description: 'Analiza, gestiona y parametriza los módulos de tu empresa',
            image: '',
            buttons: [
                { text: 'Ajustes', action: 'settings', icon: 'fa-solid fa-gear' },
                { text: 'Ver detalles', action: 'view', icon: 'fa-solid fa-arrow-right' }
            ]
        },
        {
            id: 'inventory',
            name: 'Inventarios',
            description: 'Analiza, gestiona y parametriza los módulos de tu empresa',
            image: '',
            buttons: [
                { text: 'Ajustes', action: 'settings', icon: 'fa-solid fa-gear' },
                { text: 'Ver detalles', action: 'view', icon: 'fa-solid fa-arrow-right' }
            ]
        },
        {
            id: 'accounting',
            name: 'Contabilidad',
            description: 'Analiza, gestiona y parametriza los módulos de tu empresa',
            image: '',
            buttons: [
                { text: 'Ajustes', action: 'settings', icon: 'fa-solid fa-gear' },
                { text: 'Ver detalles', action: 'view', icon: 'fa-solid fa-arrow-right' }
            ]
        },
        {
            id: 'billing',
            name: 'Facturación',
            description: 'Analiza, gestiona y parametriza los módulos de tu empresa',
            image: '', 
            buttons: [
                { text: 'Ajustes', action: 'settings', icon: 'fa-solid fa-gear' },
                { text: 'Ver detalles', action: 'view', icon: 'fa-solid fa-arrow-right' }
            ]
        },
        {
            id: 'treasury',
            name: 'Tesorería',
            description: 'Analiza, gestiona y parametriza los módulos de tu empresa',
            image: '', 
            buttons: [
                { text: 'Ajustes', action: 'settings', icon: 'fa-solid fa-gear' },
                { text: 'Comprar', action: 'buy', icon: 'fa-solid fa-box' }
            ]
        },
        {
            id: 'certicloud',
            name: 'CertiCloud',
            description: 'Analiza, gestiona y parametriza los módulos de tu empresa',
            image: '',
            buttons: [
                { text: 'Ajustes', action: 'settings', icon: 'fa-solid fa-gear' },
                { text: 'Comprar', action: 'buy', icon: 'fa-solid fa-box' }
            ]
        },
        {
            id: 'ctools',
            name: 'Ctools',
            description: 'Analiza, gestiona y parametriza los módulos de tu empresa',
            image: '', 
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
    };

    const handleSmallButtonClick = (e, action) => {
        e.stopPropagation();
        // para botones que aun no tienen accion (el verde y azul)
    };

>>>>>>> 453e51e (ModuleCard.jsx y css)
    return(
        <div className="Modules">
            <Routes>
                <Route path='' element={
                    <div className='ModulesMain'>
<<<<<<< HEAD
                        // Coloca el contenido
                        <BoldTitle text={'Modulos'}/>
                    </div>
                }/>
                <Route path='/contability' element={<span>contabilidad</span>}/>
=======
                        <div className="modules-header">
                            <BoldTitle text={'SGA - Módulos'}/>
                            <p className="modules-description">
                                Analiza, gestiona y parametriza los módulos de tu empresa
                            </p>
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
                                    <p>{module.name}</p>
                                    <div className="module-features">  
                                    </div>
                                </div>
                            </div>
                        } 
                    />
                ))}
>>>>>>> 453e51e (ModuleCard.jsx y css)
            </Routes>
        </div>
    )
}