import { useEffect, useState} from "react";
import { useAppInfo } from "../../../../context/context";
import { postInfo } from "../../../../utils/functions";
import { BoldTitle } from "../../components/BoldTitle";
import { ButtonMenu } from "../../components/ButtonMenu";
import { DescriptionSpan } from "../../components/DescriptionSpan";
import { FormInput } from "../../components/FormInput";
import { PathLocation } from "../../components/PathLocation";
import { SearchBar } from "../../components/SearchBar";
import { SelectOptions } from "../../components/SelectOptions";
import "./ReportDocuments.css";
import { ButtonDownload } from "../../components/ButtonDownload";
import { AiButton } from "../../components/ChatAiComponents/AiButton";
import {TableHistorialInstance} from '../TableHistorialInstance'

const columnsOp = [
        "Proceso",
        "Instancia",
        "Responsable",
        "Accion",
        "Descripción",
        "Fecha",
        "Estado"
    ];

export function ReportHistorialInstance() {

    // Prev Info
    const [info, setInfo] = useState([]);
    const { appInfo } = useAppInfo();
    const [searchValue,setSearchValue] = useState("");

    // Control
    const [loading, setLoading] = useState(false);
    const [start_date,setStartDate] = useState("");
    const [end_date,setEndDate] = useState("");

    const [error, setError] = useState('');
    const invalidRange = Boolean(start_date && end_date && start_date > end_date);

    useEffect(() => {
        let active = true;
        if (!appInfo.company_id || invalidRange) {
            setInfo([]);
            setLoading(false);
            return;
        }

        const getHistorial = async () => {
            setLoading(true);
            setError('');
            try {
                const result = await postInfo('/process/getInstanceHistorial', {
                    columns: columnsOp,
                    company_id: appInfo.company_id,
                    start_date,
                    end_date
                });
                if (!result?.[0] || !Array.isArray(result[1])) {
                    throw new Error('Respuesta inválida');
                }
                if (active) setInfo(result[1]);
            } catch {
                if (active) {
                    setInfo([]);
                    setError('No fue posible cargar el historial. Intenta cambiar el rango de fechas.');
                }
            } finally {
                if (active) setLoading(false);
            }
        };

        getHistorial();
        return () => { active = false; };
    }, [appInfo.company_id, start_date, end_date, invalidRange]);

    const columnMap = {
        "Proceso": "process_name",
        "Instancia": "instance_id",
        "Responsable": "user_name",
        "Accion": "nextstep_name",
        "Descripción": "description",
        "Fecha": "created_at",
        "Estado": "status"
    };

    const setInfoForReportDownload = () => {

        return info.map(element => {

            let row = {};

            columnsOp.forEach(col => {

                const backendKey = columnMap[col];

                let value = element[backendKey] ?? "";

                // formatear fecha
                if (backendKey === "created_at") {
                    value = element.created_at_local?.replace('T', ' ') ?? new Date(value).toLocaleString();
                }

                row[col] = value;

            });

            return row;

        });

    };



    

    return (
        <div className="ReportDocument">
            <PathLocation />
            <div className="headReport">
                <BoldTitle text={`Historial de acciones en procesos`} />
                <DescriptionSpan text={`Consulte el historial de acciones en los procesos.  `} />
            </div>
            <div className="settingsReport">
                <SearchBar placeholder={"Buscar"} action={setSearchValue}/>
                <div className="rangeInput">
                <FormInput action={setStartDate} value={start_date} max={end_date || undefined} required={false} type="date" title="Fecha Inicial" />
                <span>-</span>
                <FormInput action={setEndDate} value={end_date} min={start_date || undefined} required={false} type="date" title="Fecha Final" />
                </div>
                <SelectOptions
                options={[
                    "Ascendente (fecha)",
                    "Descendente (fecha)",
                    "Ascendente (Nombre)",
                    "Descendente (Nombre)",
                ]}
                title={"Orden"}
                />
                <ButtonMenu title={"Mas Ajustes"} children={<i className="fa-solid fa-sliders" />} noRotate={true} />
                <ButtonMenu title={"Agregar a favoritos"} children={<i className="fa-regular fa-star" />} noRotate={true} />
                <AiButton attached={info} sugerence={[
                    {text:'¿Que representa este informe?',context:`Procesos - Informe `},
                    {text:'Realiza un analisis de este informe',context:`Procesos - Informe - `},
                    {text:'¿Que acciones me recomiendas basado en este informe?',context:`Procesos - Informe - `}
                ]}/>
                <ButtonDownload
                    info={setInfoForReportDownload()}
                    columns={columnsOp}
                    title={"Historial_instancias_procesos"}
                />
            </div>
            {(invalidRange || error) && (
                <p role="alert">{invalidRange ? 'La fecha inicial debe ser anterior o igual a la fecha final.' : error}</p>
            )}
            <div className="SpaceReport">
                <TableHistorialInstance
                    info={info}
                    columns={columnsOp}
                    searchValue={searchValue}
                    loading={loading}
                />
            </div>
        </div>
    );
}
