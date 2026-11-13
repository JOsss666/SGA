import mcpSettingsService from './mcpSettingsService.js';

const mcpSettingsController = {};

const resolveBaseUrl = (req) =>
    (process.env.PUBLIC_API_URL || `${req.protocol}://${req.get('host')}`).replace(/\/+$/, '');

const requestContext = (req) => ({ ip: req.ip, userAgent: req.get('user-agent') });

// Las respuestas con secretos o tokens nunca deben quedar en caché.
const respond = (res, status, data) => {
    res.setHeader('Cache-Control', 'no-store');
    return res.status(status).json({ ok: true, data });
};

const handler = (action, status = 200) => async (req, res, next) => {
    try {
        await mcpSettingsService.assertCanManage(req.auth);
        const data = await action(req);
        return respond(res, status, data);
    } catch (error) {
        next(error);
    }
};

const base = (req) => ({
    companyId: req.auth.companyId,
    userId: req.auth.userId,
    baseUrl: resolveBaseUrl(req)
});

mcpSettingsController.getOverview = handler(req => mcpSettingsService.getOverview(base(req)));
mcpSettingsController.createCredentials = handler(req => mcpSettingsService.createCredentials(base(req)), 201);
mcpSettingsController.rotateSecret = handler(req => mcpSettingsService.rotateSecret(base(req)));
mcpSettingsController.setStatus = handler(req => mcpSettingsService.setStatus({
    companyId: req.auth.companyId,
    status: req.body?.status
}));
mcpSettingsController.setWriteAccess = handler(req => mcpSettingsService.setWriteAccess({
    companyId: req.auth.companyId,
    userId: req.auth.userId,
    enabled: req.body?.enabled
}));
mcpSettingsController.issueAccessToken = handler(req => mcpSettingsService.issueAccessToken({
    ...base(req),
    requestContext: requestContext(req)
}));

export default mcpSettingsController;
