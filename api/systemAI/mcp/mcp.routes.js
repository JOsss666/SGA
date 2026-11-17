import crypto from 'node:crypto';
import express from 'express';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { authenticateIntegration, requireScope } from '../../middleware/integrationAuth.js';
import { createMcpServer } from './mcpServerFactory.js';

const mcpRouter = express.Router();

// Modo sin estado: cada petición crea su servidor y su transporte, ya
// acotados a la compañía del JWT. No hay sesiones compartidas entre empresas.
mcpRouter.post(
    '/',
    authenticateIntegration,
    requireScope('mcp:read'),
    express.json({ limit: '256kb', strict: true }),
    async (req, res, next) => {
        const server = createMcpServer({
            integration: req.integration,
            requestId: crypto.randomUUID()
        });
        const transport = new StreamableHTTPServerTransport({
            sessionIdGenerator: undefined,
            enableJsonResponse: true
        });
        res.on('close', () => {
            transport.close();
            server.close();
        });
        try {
            await server.connect(transport);
            await transport.handleRequest(req, res, req.body);
        } catch (error) {
            next(error);
        }
    }
);

// En modo sin estado no hay stream servidor→cliente ni sesión que cerrar.
const methodNotAllowed = (req, res) => res.status(405).json({
    jsonrpc: '2.0',
    error: { code: -32000, message: 'Método no permitido.' },
    id: null
});
mcpRouter.get('/', methodNotAllowed);
mcpRouter.delete('/', methodNotAllowed);

export default mcpRouter;
