import { useDataBase } from "../app.js";

const AnalyticController = {};

AnalyticController.getProcessInstanceUsersAvtivity = (req,res)=>{
    let data = '';
    req.on('data',chunk=>{
        data += chunk;
    })
    req.on('end',async()=>{
        let info = JSON.parse(data);
        let values = [];
        let whereClauses = [];

        whereClauses.push(`ph.company_id = $1`);
        values.push(info.company_id)

        if(info.userStatus != undefined){
            whereClauses.push(`u.status = $${values.length +1}`);
            values.push(info.userStatus)
        }

        // Dates Filters
            if (info.start_date) {
                values.push(info.start_date);
                whereClauses.push(
                    `pi.created_at >= $${values.length}`
                );
            }

            if (info.end_date) {
                values.push(info.end_date);
                whereClauses.push(
                    `pi.created_at <= $${values.length}`
                );
            }

        const whereQuery = whereClauses.length > 0
            ? `WHERE ${whereClauses.join(" AND ")}`
            : "";
        
        let sentence = `
            SELECT
                -- Truncamos la fecha del historial (que es la de la actividad real)
                DATE_TRUNC('day', ph.created_at) AS periodo,
                u.user_name,
                u.user_id,
                COUNT(ph.id) AS total_acciones
            FROM
                "Process".process_historial ph
            INNER JOIN
                "Ecosystem".users u ON ph.user_id = u.user_id
            INNER JOIN
                "Process".process_instance pi ON ph.instance_id = pi.id
            ${whereQuery}
            GROUP BY
                periodo,
                u.user_id,
                u.user_name
            ORDER BY
                periodo ASC,
                total_acciones DESC;
        `;

        let consulta = await useDataBase(sentence,values,1);
        res.writeHead(200,{'Content-Type':'text/plain'})
        res.end(JSON.stringify(consulta));
    })
    req.on('error',(err)=>{
        res.writeHead(500,{'Content-Type':'text/plain'})
        res.end(JSON.stringify(err))
    })
}

AnalyticController.getProcessStepsCycleTime = (req, res) => {
    let data = '';
    req.on('data', chunk => {
        data += chunk;
    });
    req.on('end', async () => {
        try {
            let info = JSON.parse(data);
            let values = [];
            let whereClauses = [];

            whereClauses.push(`ph.company_id = $1`);
            values.push(info.company_id);

            // Filtro por proceso específico (Recomendado para que la transición tenga sentido)
            if (info.process_id) {
                values.push(info.process_id);
                whereClauses.push(`pi.process_id = $${values.length}`);
            }

            if (info.start_date) {
                values.push(info.start_date);
                whereClauses.push(`ph.created_at >= $${values.length}`);
            }

            if (info.end_date) {
                values.push(info.end_date);
                whereClauses.push(`ph.created_at <= $${values.length}`);
            }

            const whereQuery = whereClauses.length > 0
                ? `WHERE ${whereClauses.join(" AND ")}`
                : "";

            let sentence = `
                WITH DuracionesCalculadas AS (
                    SELECT 
                        ph.instance_id,
                        -- Identificamos la transición: "Paso A ➔ Paso B"
                        ps_prev.name || ' ➔ ' || ps_next.name AS transicion,
                        ph.created_at AS fecha_fin,
                        LAG(ph.created_at) OVER (PARTITION BY ph.instance_id ORDER BY ph.created_at) AS fecha_inicio
                    FROM 
                        "Process".process_historial ph
                    INNER JOIN 
                        "Process".process_steps ps_prev ON ph.previous_step = ps_prev.id
                    INNER JOIN 
                        "Process".process_steps ps_next ON ph.next_step = ps_next.id
                    INNER JOIN
                        "Process".process_instance pi ON ph.instance_id = pi.id
                    ${whereQuery}
                )
                SELECT 
                    -- Agrupamos por el día del evento
                    TO_CHAR(DATE_TRUNC('day', fecha_fin), 'YYYY-MM-DD') AS label,
                    transicion AS user_name, 
                    -- CAMBIO AQUÍ: Dividimos por 60 para obtener MINUTOS
                    ROUND(AVG(EXTRACT(EPOCH FROM (fecha_fin - fecha_inicio)) / 60)::numeric, 2) AS total
                FROM 
                    DuracionesCalculadas
                WHERE 
                    fecha_inicio IS NOT NULL
                GROUP BY 
                    label, 
                    transicion
                ORDER BY 
                    label ASC;
            `;

            let consulta = await useDataBase(sentence, values, 1);
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(consulta));

        } catch (err) {
            console.error("Error:", err);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: err.message }));
        }
    });
};

export default AnalyticController