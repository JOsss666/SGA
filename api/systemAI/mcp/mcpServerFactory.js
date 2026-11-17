import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import {
    CallToolRequestSchema,
    ListToolsRequestSchema
} from '@modelcontextprotocol/sdk/types.js';
import toolRegistry from '../tools/ToolRegistry.js';
import ToolExecutor from '../tools/ToolExecutor.js';
import SystemAIError from '../core/errors/SystemAIError.js';

const SERVER_INFO = Object.freeze({ name: 'sga360-mcp', version: '0.1.0' });
const toolExecutor = new ToolExecutor();

// Los scopes de la integración actúan como permisos de las tools. Una tool es
// visible solo si la credencial posee todos los permisos que declara.
const isAllowed = (tool, scopes) =>
    (tool.surfaces ?? ['chat', 'mcp']).includes('mcp') &&
    (tool.operation === 'read' || tool.operation === 'write') &&
    (tool.permissions || []).every(permission => scopes.has(permission));

const toTextResult = (payload, isError = false) => ({
    content: [{ type: 'text', text: JSON.stringify(payload) }],
    isError
});

/**
 * Crea un servidor MCP efímero para UNA petición. La compañía queda fijada
 * aquí a partir del JWT; ninguna tool puede recibirla desde el agente.
 */
export const createMcpServer = ({ integration, requestId }) => {
    const scopes = new Set(integration.scopes || []);
    const allowedTools = () => toolRegistry
        .list()
        .filter(tool => isAllowed(tool, scopes));
    const byName = () => new Map(
        toolRegistry.resolve(allowedTools().map(tool => tool.id))
            .map(tool => [tool.definition.function.name, tool])
    );

    const server = new Server(SERVER_INFO, { capabilities: { tools: {} } });

    server.setRequestHandler(ListToolsRequestSchema, async () => ({
        tools: allowedTools().map(({ definition, operation }) => ({
            name: definition.function.name,
            description: definition.function.description,
            inputSchema: definition.function.parameters,
            annotations: {
                readOnlyHint: operation !== 'write',
                destructiveHint: false,
                idempotentHint: operation === 'write',
                openWorldHint: false
            }
        }))
    }));

    server.setRequestHandler(CallToolRequestSchema, async ({ params }) => {
        const tool = byName().get(params.name);
        if (!tool) {
            return toTextResult({ error: { code: 'TOOL_NOT_ALLOWED', message: 'Tool no disponible para esta credencial.' } }, true);
        }

        const startedAt = Date.now();
        let success = false;
        try {
            const result = await toolExecutor.execute({
                tool,
                arguments: params.arguments || {},
                context: {
                    companyId: integration.companyId,
                    userId: integration.serviceUserId,
                    permissions: [...scopes],
                    requestId,
                    source: 'mcp',
                    // Solo las tools cuyos permisos cubren los scopes llegan aquí.
                    allowWrites: true
                }
            });
            success = true;
            return toTextResult(result);
        } catch (error) {
            const expected = error instanceof SystemAIError && error.statusCode < 500;
            return toTextResult({
                error: {
                    code: expected ? error.code : 'TOOL_EXECUTION_FAILED',
                    message: expected ? error.message : 'No fue posible ejecutar la tool.'
                }
            }, true);
        } finally {
            console.info(JSON.stringify({
                event: 'mcp_tool_call',
                request_id: requestId,
                company_id: integration.companyId,
                client_id: integration.clientId,
                tool: params.name,
                success,
                duration_ms: Date.now() - startedAt
            }));
        }
    });

    return server;
};
