import { useCallback, useEffect, useState } from "react"
import { getInfo, postInfo } from "../../../../utils/functions";
import { useAppInfo, useNotifications } from "../../../../context/context";
import { BoldTitle } from "../../components/BoldTitle";
import { DescriptionSpan } from "../../components/DescriptionSpan";
import { FormButton } from "../../components/FormButton";
import { TagIndicator } from "../../components/TagIndicator";
import { KeyRow } from "../../components/KeyRow";
import './McpSettings.css'

const BASE = '/api/mcp/v1/settings';
const STATUS_LABELS = {
    active:{text:'Activo', type:'active'},
    suspended:{text:'Suspendido', type:'suspended'},
    revoked:{text:'Revocado', type:'disabled'}
};

export function McpSettings(){

    const {appInfo} = useAppInfo();
    const {addNotification} = useNotifications();
    const [overview,setOverview] = useState(null);
    // El secreto y el token solo existen en memoria tras crear/rotar/generar:
    // el backend nunca los vuelve a entregar.
    const [clientSecret,setClientSecret] = useState('');
    const [token,setToken] = useState(null);
    const [busy,setBusy] = useState(false);

    const notifyError = (error)=>addNotification({
        type:'error',
        description:error?.error?.message || error?.message || 'No fue posible completar la operación.'
    });

    const load = useCallback(async()=>{
        if(!appInfo?.company_id) return;
        try{
            const res = await getInfo(`${BASE}/`,{companyId:appInfo.company_id});
            setOverview(res.data);
        }catch(error){
            notifyError(error);
        }
    },[appInfo?.company_id]);

    useEffect(()=>{ load(); },[load]);

    const run = async(route,onDone)=>{
        setBusy(true);
        try{
            const res = await postInfo(`${BASE}${route}`,{company_id:appInfo.company_id});
            onDone(res.data);
            await load();
        }catch(error){
            notifyError(error);
        }finally{
            setBusy(false);
        }
    }

    const createCredentials = ()=>run('/credentials',data=>{
        setClientSecret(data.client_secret);
        setToken(null);
        addNotification({type:'aproved',description:'Credenciales creadas. Copia el client secret ahora.'});
    });

    const rotateSecret = ()=>run('/credentials/rotate',data=>{
        setClientSecret(data.client_secret);
        setToken(null);
        addNotification({type:'aproved',description:'Secreto rotado. Los tokens anteriores dejaron de funcionar.'});
    });

    const issueToken = ()=>run('/access-token',data=>setToken(data));

    const client = overview?.client;
    const configured = Boolean(overview?.configured);
    const active = client?.status === 'active';

    // Va a ~/.codex/config.toml. El token no se incluye: Codex lo lee de la
    // variable de entorno SGA_MCP_TOKEN (export SGA_MCP_TOKEN="<access token>").
    const codexConfig = overview?.server?.url
        ? `[mcp_servers.sga]\nurl = "${overview.server.url}"\nbearer_token_env_var = "SGA_MCP_TOKEN"`
        : '';

    const rows = [
        {label:'URL del servidor MCP', value:overview?.server?.url, sensitive:false},
        {label:'URL del token', value:overview?.server?.token_url, sensitive:false},
        {label:'Client ID', value:client?.client_id, sensitive:false, hint:'Aún no hay credenciales'},
        {label:'Client secret', value:clientSecret, hint:'Solo se muestra al crear o rotar'},
        {label:'Access token', value:token?.access_token, hint:'Genera un token para conectar'},
        {label:'Comando para Claude Code', value:token?.claude_command, hint:'Se genera junto al token'},
        {label:'Configuración para Codex', value:codexConfig, sensitive:false, hint:'Se genera con la URL del servidor'}
    ];

    return(
        <div className="McpSettings">
            <div className="mainTtl">
                <BoldTitle text={'SGA 360 | MCP'}/>
                {configured && (
                    <>
                        <TagIndicator
                            title={STATUS_LABELS[client.status]?.text ?? client.status}
                            type={STATUS_LABELS[client.status]?.type}
                            desc={`Estado de las credenciales: ${client.status}`}
                        />
                        {client.last_used_at && (
                            <DescriptionSpan text={`Último uso: ${new Date(client.last_used_at).toLocaleString('es-CO')}`}/>
                        )}
                    </>
                )}
            </div>
            <DescriptionSpan text={'Conecte sga360 a sus servicios de IA propios para una mejor experiencia.'}/>

            

            <div className="credentials">
                {rows.map(row=>(
                    <KeyRow key={row.label} info={row}/>
                ))}
            </div>

            <div className="mcpActions">
                {!configured && (
                    <FormButton type="button" className="mcpButton primary" text="Crear credenciales"
                        disabled={busy || !overview} loading={busy} onClick={createCredentials}/>
                )}
                {configured && (
                    <>
                        <FormButton type="button" className="mcpButton primary" text="Generar access token"
                            disabled={busy || !active} loading={busy} onClick={issueToken}/>
                        <FormButton type="button" className="mcpButton" text="Rotar secreto"
                            disabled={busy} onClick={rotateSecret}/>
                    </>
                )}
            </div>

            {token && (
                <DescriptionSpan text={`El token vence el ${new Date(token.expires_at).toLocaleString('es-CO')}.`}/>
            )}
        </div>
    )
}
