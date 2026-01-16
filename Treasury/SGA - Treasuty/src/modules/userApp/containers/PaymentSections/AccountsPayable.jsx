import { SearchBar } from "../../components/SearchBar"
import { FormInput } from "../../components/FormInput"
import { SelectOptions } from "../../components/SelectOptions"
import { ButtonMenu } from "../../components/ButtonMenu"
import { AiButton } from "../../components/ChatAiComponents/AiButton"
import { ButtonDownload } from "../../components/ButtonDownload"
import { TableReport } from "../TableReport"
import { useState } from "react"
import { useAppInfo } from "../../../../context/context"
import "../reports/ReportDocuments.css";
import './AccountsPayable.css'

export function AccountsPayable(){

    const [info,setInfo] = useState([]);
    const {appInfo} = useAppInfo();
    const [searchValue, setSearchValue] = useState("");
    const [loading, setLoading] = useState(false);

    const columsDictionary = [
        "ID",
        "Fecha Documento",
        "Tercero",
        "Tipo Documento",
        "Concepto",
        "Tienda",
        "Negocio",
        "Centro de Costo",
        "Sub Total",
        "Valor",
    ];

    const settingsReport = {
        columns: columsDictionary,
        company_id: appInfo.company_id,
    };

    return(
        <div className="AccountsPayable ReportDocument">
            <div className="settingsReport">
                <SearchBar placeholder={"Buscar"} action={setSearchValue} />
                    <div className="rangeInput">
                        <FormInput type={"date"} title={"Fecha Inicial"} />
                        <span>-</span>
                        <FormInput type={"date"} title={"Fecha Final"} />
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
                    <ButtonMenu title={"Mas Ajustes"} noRotate={true}>
                        <i className="fa-solid fa-sliders" />
                    </ButtonMenu>
                    <AiButton
                        attached={info}
                        sugerence={[
                        {
                            text: "¿Que representa este informe?",
                            context: "Procesos - Informe - Pagos",
                        },
                        {
                            text: "Realiza un analisis de este informe",
                            context: "Procesos - Informe - Pagos",
                        },
                        {
                            text:
                            "¿Que acciones me recomiendas basado en este informe?",
                            context: "Procesos - Informe - Pagos",
                        },
                        ]}
                    />
                    <ButtonDownload />
                </div>

                <div className="SpaceReport">
                {!loading && (
                    <TableReport
                        columns={settingsReport.columns}
                        info={info}
                        searchValue={searchValue}
                    />
                )}

                {/* Loading desactivado */}
                {/* {loading && (
                    <LoadingSpace
                    title={"Cargando información"}
                    description={"Esto no debe tardar mucho..."}
                    />
                )} */}
                </div>
        </div>
    )
}