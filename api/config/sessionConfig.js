import 'dotenv/config';

const parsePositiveInteger = (value, fallback) => {
    const parsed = Number.parseInt(value, 10);
    return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : fallback;
};

const isProduction = process.env.NODE_ENV === 'production';
const secure = process.env.SESSION_SECURE_COOKIE
    ? process.env.SESSION_SECURE_COOKIE === 'true'
    : isProduction;
const sameSite = process.env.SESSION_COOKIE_SAME_SITE || (isProduction ? 'none' : 'lax');

const sessionConfig = Object.freeze({
    cookieName: process.env.SESSION_COOKIE_NAME || (secure ? '__Host-sga_session' : 'sga_session'),
    secure,
    sameSite,
    idleTimeoutMinutes: parsePositiveInteger(process.env.SESSION_IDLE_TIMEOUT_MINUTES, 45),
    absoluteTimeoutHours: parsePositiveInteger(process.env.SESSION_ABSOLUTE_TIMEOUT_HOURS, 8),
    touchIntervalMinutes: parsePositiveInteger(process.env.SESSION_TOUCH_INTERVAL_MINUTES, 5),
    tokenPepper: process.env.SESSION_TOKEN_PEPPER || '',
    trustLegacyCompanyBody: process.env.SESSION_TRUST_LEGACY_COMPANY_BODY === 'true'
});

export const validateSessionConfig = () => {
    const errors = [];
    if (!sessionConfig.tokenPepper || sessionConfig.tokenPepper.length < 32) {
        errors.push('SESSION_TOKEN_PEPPER debe contener al menos 32 caracteres.');
    }
    if (!['strict', 'lax', 'none'].includes(sessionConfig.sameSite)) {
        errors.push('SESSION_COOKIE_SAME_SITE debe ser strict, lax o none.');
    }
    if (sessionConfig.sameSite === 'none' && !sessionConfig.secure) {
        errors.push('SameSite=None requiere SESSION_SECURE_COOKIE=true.');
    }
    if (sessionConfig.cookieName.startsWith('__Host-') && !sessionConfig.secure) {
        errors.push('Una cookie __Host- requiere Secure.');
    }
    return errors;
};

export default sessionConfig;
