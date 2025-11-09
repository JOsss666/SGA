import { useNavigate, Routes, Route } from 'react-router-dom';
import { BoldTitle } from '../components/BoldTitle';
import { UserCard } from '../components/UserCard';
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
            image: '',
            description: 'Analiza, gestiona y parametriza los módulos de tu empresa',
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
        }
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
    };

    const handleSmallButtonClick = (e, action) => {
        e.stopPropagation();
    };

     return(
        <div className="Modules">
            <Routes>
                <Route path='' element={
                    <div className='ModulesMain'>
                        <div className="modules-header">
                            <BoldTitle text={'SGA - Módulos'}/>
                            <p className="modules-description">
                                Analiza, gestiona y parametriza los módulos de tu empresa
                            </p>
                        </div>
                        
                        <div className="modules-grid">
                            {modulesData.map((module) => (
                                <div 
                                    key={module.id}
                                    className="module-card"
                                    onClick={() => handleCardClick(module.id)}
                                >
                                    <div className="module-header">
                                        <div className="module-image">
                                            <UserCard 
                                                imgSrc={module.image}
                                                name={module.name}
                                                desc={module.description}
                                            />
                                        </div>
                                        <div className="module-content">
                                            <h3 className="module-title">{module.name}</h3>
                                            {}
                                        </div>
                                    </div>
                                    <div className="module-buttons">
                                        <div className="module-description-container">
                                            <p className="module-description">{module.description}</p>
                                        </div>
                                        <div className="module-actions">
                                            <div className="buttons-left">
                                                {module.buttons.map((button, index) => (
                                                    <button
                                                        key={index}
                                                        className={`module-btn ${button.action === 'view' ? 'btn-view' : button.action === 'buy' ? 'btn-buy' : 'btn-settings'}`}
                                                        onClick={(e) => handleButtonClick(e, module.id, button.action)}
                                                    >
                                                        <i className={button.icon}></i>
                                                        {button.text}
                                                    </button>
                                                ))}
                                            </div>
                                            <div className="buttons-right">
                                                {module.buttons.map((button, index) => (
                                                    (button.action === 'view' || button.action === 'buy') && (
                                                        <button
                                                            key={`small-${index}`}
                                                            className={`small-btn ${button.action === 'view' ? 'small-btn-green' : 'small-btn-blue'}`}
                                                            onClick={(e) => handleSmallButtonClick(e, button.action)}
                                                        >
                                                            <div className="circle-icon">
                                                                <i className={button.action === 'view' ? 'fa-solid fa-check' : 'fa-solid fa-cart-shopping'}></i>
                                                            </div>
                                                        </button>
                                                    )
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                }/>
                
                <Route path='ajustes' element={
                    <div className="ajustes-page">
                        <BoldTitle text={'Ajustes'} />
                        <p></p>
                    </div>
                }/>
                
                {modulesData.map(module => (
                    <Route 
                        key={module.id} 
                        path={module.id} 
                        element={<div></div>} 
                    />
                ))}
            </Routes>
        </div>
    );
}