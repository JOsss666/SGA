import { encrypt, queryDataBase } from '../app.js';
import sessionRepository from '../repositories/sessionRepository.js';
import sessionService from '../services/sessionService.js';
import sessionCookieService from '../services/sessionCookieService.js';
import SessionError from '../errors/SessionError.js';

const sessionAuthController = {};

sessionAuthController.login = async (req, res, next) => {
    try {
        const mail = typeof req.body?.mail === 'string' ? req.body.mail.trim().toLowerCase() : '';
        const password = typeof req.body?.pass === 'string' ? req.body.pass : '';
        if (!mail || !password) {
            throw new SessionError('Correo y contraseña son obligatorios.', {
                statusCode: 400,
                code: 'INVALID_LOGIN_REQUEST'
            });
        }

        const result = await queryDataBase(`
            SELECT u.user_id, u.company_id, u.user_name, u.user_mail, u.user_key,
                u.status, c.company_key
            FROM "Ecosystem".users AS u
            LEFT JOIN "Ecosystem".companies AS c ON c.company_id = u.company_id
            WHERE LOWER(u.user_mail) = $1
              AND u.user_password = $2
              AND u.status IN ('active', 'hidden')
            LIMIT 1
        `, [mail, encrypt(password)]);
        const user = result.rows[0];
        if (!user) return res.status(200).json([false, []]);

        // Una autenticación correcta reemplaza la sesión que este navegador
        // tuviera previamente, incluso si pertenece a otro usuario.
        const previousToken = sessionCookieService.read(req);
        if (previousToken) {
            await sessionService.revokeSession(previousToken, 'replaced_by_login');
        }
        const { rawToken } = await sessionService.createSession({
            userId: user.user_id,
            ip: req.ip,
            userAgent: req.get('user-agent')
        });
        sessionCookieService.set(res, rawToken);

        await queryDataBase(`
            UPDATE "Ecosystem".users_access SET user_session = true WHERE user_id = $1
        `, [user.user_id]);

        return res.status(200).json([true, [user]]);
    } catch (error) {
        next(error);
    }
};

sessionAuthController.logout = async (req, res, next) => {
    const rawToken = sessionCookieService.read(req);
    let authenticatedUserId = req.auth?.userId;
    // Se prepara el borrado antes de cualquier acceso a base de datos para que
    // incluso una sesión expirada o un error de revocación eliminen la cookie.
    sessionCookieService.clear(res);
    try {
        // El endpoint también debe poder borrar una cookie expirada o revocada.
        // Por eso logout no depende del middleware authenticateSession.
        if (!authenticatedUserId && rawToken) {
            try {
                const session = await sessionService.validateSession(rawToken);
                authenticatedUserId = Number(session.user_id);
            } catch {
                // Una sesión inválida igualmente debe eliminarse del navegador.
            }
        }
        await sessionService.revokeSession(rawToken, 'logout');
        if (authenticatedUserId) {
            await queryDataBase(`
                UPDATE "Ecosystem".users_access SET user_session = false WHERE user_id = $1
            `, [authenticatedUserId]);
        }
        return res.status(200).json([true, 1]);
    } catch (error) {
        next(error);
    }
};

sessionAuthController.currentSession = async (req, res, next) => {
    try {
        const companies = await sessionRepository.listCompaniesForUser(req.auth.userId);
        return res.status(200).json({
            ok: true,
            data: {
                user: {
                    id: req.auth.userId,
                    name: req.auth.userName,
                    mail: req.auth.userMail
                },
                companies
            }
        });
    } catch (error) {
        next(error);
    }
};

export default sessionAuthController;
