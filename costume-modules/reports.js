import { nexoReports } from './nexo360/src/reports';
import { zjReports } from './zjSAS.S/src/reports';

const customReports = [...nexoReports, ...zjReports];

export const getCustomReports = (appInfo, appConfig) => (
    customReports.filter(report => report.canAccess(appInfo, appConfig))
);
