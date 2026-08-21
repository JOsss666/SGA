import sessionService from '../services/sessionService.js';
import sessionCookieService from '../services/sessionCookieService.js';

export const authenticateSession = async (req, res, next) => {
    try {
        const rawToken = sessionCookieService.read(req);
        const session = await sessionService.validateSession(rawToken);
        req.auth = Object.freeze({
            sessionId: Number(session.id),
            userId: Number(session.user_id),
            userName: session.user_name,
            userMail: session.user_mail
        });
        next();
    } catch (error) {
        next(error);
    }
};
