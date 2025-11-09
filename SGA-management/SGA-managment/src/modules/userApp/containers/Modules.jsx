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
            
        </div>
    );
}