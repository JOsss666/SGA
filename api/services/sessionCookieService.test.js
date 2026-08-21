import test from 'node:test';
import assert from 'node:assert/strict';
import sessionCookieService, { parseCookies } from './sessionCookieService.js';

test('extrae la cookie de sesión sin depender de cookie-parser', () => {
    const cookies = parseCookies('theme=dark; sga_session=abc%20123');
    assert.equal(cookies.theme, 'dark');
    assert.equal(cookies.sga_session, 'abc 123');
});

test('ignora de forma segura valores mal codificados', () => {
    const cookies = parseCookies('sga_session=%E0%A4%A');
    assert.equal(cookies.sga_session, '');
});

test('elimina la cookie usando el mismo path y una expiración pasada', () => {
    let cookieHeader;
    const res = { setHeader(name, value) { if (name === 'Set-Cookie') cookieHeader = value; } };

    sessionCookieService.clear(res);

    assert.match(cookieHeader, /Path=\//);
    assert.match(cookieHeader, /HttpOnly/);
    assert.match(cookieHeader, /Max-Age=0/);
    assert.match(cookieHeader, /Expires=Thu, 01 Jan 1970 00:00:00 GMT/);
});
