import { lazy } from 'react';

const canAccess = (_appInfo, appConfig) => Boolean(
    appConfig?.access?.services?.personalized?.['custom-modules']?.['z&j_clicksControl']?.access
);

export const zjReports = [
    {
        path: 'zjClicksReport',
        title: 'Informe de clicks (Beta)',
        description: 'Versión de prueba Beta V 1.1',
        type: 'processes',
        icon: 'fa-solid fa-arrow-pointer',
        canAccess,
        Component: lazy(() => import('./containers/reports/ClicksReport').then(module => ({ default: module.ClicksReport })))
    },
    {
        path: 'zjServicesReport',
        title: 'Informe de servicios (Alpha)',
        description: 'Versión de prueba Alpha V 1.1',
        type: 'inventarios',
        icon: 'fa-solid fa-screwdriver-wrench',
        canAccess,
        Component: lazy(() => import('./containers/reports/ServiceMovements').then(module => ({ default: module.ServiceMovements })))
    },
    {
        path: 'zjAuditoryClicksReport',
        title: 'Auditoria de clicks (V0.01)',
        description: 'Versión de prueba Alpha V 1.1',
        type: 'processes',
        icon: 'fa-solid fa-shield-halved',
        canAccess,
        Component: lazy(() => import('./containers/reports/AuditoryClicksReport').then(module => ({ default: module.AuditoryClicksReport })))
    }
];
