import sessionConfig from '../config/sessionConfig.js';

const parseCookies = (header = '') => Object.fromEntries(
    header.split(';').map(value => value.trim()).filter(Boolean).map(value => {
        const separator = value.indexOf('=');
        if (separator < 0) return [value, ''];
        const name = value.slice(0, separator);
        const rawValue = value.slice(separator + 1);
        try {
            return [name, decodeURIComponent(rawValue)];
        } catch {
            return [name, ''];
        }
    })
);

const serializeCookie = (name, value, { maxAge, expires }) => {
    const attributes = [
        `${name}=${encodeURIComponent(value)}`,
        'Path=/',
        'HttpOnly',
        `SameSite=${sessionConfig.sameSite[0].toUpperCase()}${sessionConfig.sameSite.slice(1)}`
    ];
    if (sessionConfig.secure) attributes.push('Secure');
    if (Number.isFinite(maxAge)) attributes.push(`Max-Age=${Math.max(0, Math.floor(maxAge / 1000))}`);
    if (expires instanceof Date) attributes.push(`Expires=${expires.toUTCString()}`);
    return attributes.join('; ');
};

const sessionCookieService = {
    read(req) {
        return parseCookies(req.headers.cookie)[sessionConfig.cookieName] || null;
    },

    set(res, rawToken) {
        res.setHeader('Set-Cookie', serializeCookie(sessionConfig.cookieName, rawToken, {
            maxAge: sessionConfig.absoluteTimeoutHours * 3600000
        }));
    },

    clear(res) {
        res.setHeader('Set-Cookie', serializeCookie(sessionConfig.cookieName, '', {
            maxAge: 0,
            expires: new Date(0)
        }));
    }
};

export { parseCookies };
export default sessionCookieService;
