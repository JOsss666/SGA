import { lazy } from 'react';

export const nexoReports = [{
    path: 'NexoProcessAdministration',
    title: 'Administración de procesos NEXO 360',
    description: 'Sigue cada orden desde el cliente hasta la gestión administrativa y el proveedor',
    type: 'processes',
    icon: 'fa-solid fa-diagram-project',
    canAccess: (appInfo) => String(appInfo?.company_id) === '7',
    Component: lazy(() => import('./pages/processAdministrationReport').then(module => ({ default: module.ProcessAdministrationReport })))
}];
