import { useEffect, useState } from "react";
import { useAppInfo } from "../../../../context/context";
import { postInfo } from "../../../../utils/functions";
import { BoldTitle } from "../../components/BoldTitle";
import { ButtonMenu } from "../../components/ButtonMenu";
import { DescriptionSpan } from "../../components/DescriptionSpan";
import { FormInput } from "../../components/FormInput";
import { PathLocation } from "../../components/PathLocation";
import { SearchBar } from "../../components/SearchBar";
import { SelectOptions } from "../../components/SelectOptions";
import { TableReport } from "../TableReport";
import "./ReportDocuments.css";
import { LoadingSpace } from "../LoadingSpace";
import { ButtonDownload } from "../../components/ButtonDownload";
import { AiButton } from "../../components/ChatAiComponents/AiButton";

export function ReportDocuments({ type }) {

    // Estados
    const [info, setInfo] = useState([]);
    const { appInfo } = useAppInfo();
    const [searchValue, setSearchValue] = useState("");
    const [loading, setLoading] = useState(false);

    // Tipos de documento
    const documentTypes = {
        'Client Order': "Ordenes de Cliente",
        'Production Order': "Ordenes de Producción",
        'Purchase Document': "Documentos de Compra",
        'Inventory Consume': "Consumos de inventario",
        'Sell Invoice': "Facturas de venta",
        TR: "Transacciónes",
        TR_details: "Detalles de la Transacción",
    };

    // Columnas
    const columnsOp = [
        "ID","Tienda","Creada por","Cliente",
        "Ingreso Presupuestado","Costo Presupuestado",
        "Costo Ejecutado","Valor Facturado",
        "Fecha de entrega","Estado",
    ];

    const columnsOc = [
        "ID","OP","Tienda","Creada por","Cliente",
        "Descripción","Ingreso Presupuestado",
        "Costo Presupuestado","Fecha creación","Estado",
    ];

    const columnsDc = [
        "ID","OP","Tienda","Creada por","Cliente",
        "Descripción","Valor","Fecha creación","Estado",
    ];

    const columnsSellInvoice = [
        "ID","OP","Tienda","Creada por","Cliente",
        "Descripción","Valor","Factura electrónica","Fecha creación","Estado",
    ];

    const columsTr = [
        "ID","Fecha Documento","Tipo Doc","Concepto",
        "Subtotal","Valor","Tienda","Tercero",
        "Negocio","Centro de costo","Estado",
        "Creada por","Fecha creación","Ver Detalles"
    ];

    const columsTr_details = [
        "ID","Concepto","Creada por",
        "Fecha Documento","Subtotal","Valor ","Fecha creación",
    ];

    const columsDictionary = {
        'Production Order': columnsOp,
        'Client Order': columnsOc,
        'Purchase Document': columnsDc,
        'Sell Invoice': columnsSellInvoice,
        'Inventory Consume': columnsDc,
        TR: columsTr,
        TR_details: columsTr_details,
    };

    // Configuración
    const settingsReport = {
        columns: columsDictionary[type] || [],
        company_id: appInfo.company_id,
        type,
    };

    // Obtener datos
    const GetDocuments = async () => {

        setLoading(true);

        let res;

        if(type === "TR_details"){
            res = await postInfo('/getTransactionDetails', settingsReport);
        } 
        else if (type === "TR"){
            res = await postInfo('/getTransactions', settingsReport);
        } 
        else {
            res = await postInfo('/process/getDocuments', settingsReport);
        }
        
        if(res && res[0]){
            setInfo(res[1]);
        }

        setLoading(false);
    };

    useEffect(() => {
        GetDocuments();
    }, [type]);

    const tableData = Array.isArray(info)
        ? info.filter((row)=>
            Object.values(row)
                .join(" ")
                .toLowerCase()
                .includes(searchValue.toLowerCase())
        )
        : [];

    const columnMap = {
        "ID": "ownSerial",
        "Fecha Documento": "doc_date",
        "Tipo Doc": "doc_type",
        "Concepto": "concept_name",
        "Subtotal": "subTotal",
        "Valor": "total",
        "Tienda": "store_name",
        "Tercero": "thirdparty_name",
        "Negocio": "bussines_name",
        "Centro de costo": "costcenter_name",
        "Estado": "status",
        "Factura electrónica": "electronic_invoice_number",
        "Creada por": "user_name",
        "Fecha creación": "created_at",
        "Ver Detalles": "id"
    };

    const setInfoForReportDownload = () => {

        return tableData.map(element => {

            let row = {};

            settingsReport.columns.forEach(col => {

            const key = columnMap[col];

            row[col] = key ? (element[key] ?? "") : "";

            });

            return row;

        });

    };

    return (
        <div className="ReportDocument">

            <PathLocation />

            <div className="headReport">
                <BoldTitle text={`Informe de ${documentTypes[type]}`} />
                <DescriptionSpan text={`Informe del estado de todos los documentos (${type}).`} />
            </div>

            <div className="settingsReport">

                <SearchBar placeholder={"Buscar"} action={setSearchValue}/>

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

                <ButtonMenu title={"Mas Ajustes"} children={<i className="fa-solid fa-sliders" />} noRotate />
                <ButtonMenu title={"Agregar a favoritos"} children={<i className="fa-regular fa-star" />} noRotate />

                <AiButton 
                    attached={tableData}
                    sugerence={[
                        {text:'¿Que representa este informe?',context:`Procesos - Informe - ${documentTypes[type]}`},
                        {text:'Realiza un analisis de este informe',context:`Procesos - Informe - ${documentTypes[type]}`},
                        {text:'¿Que acciones me recomiendas basado en este informe?',context:`Procesos - Informe - ${documentTypes[type]}`}
                    ]}
                />

                <ButtonDownload
                    info={setInfoForReportDownload()}
                    columns={settingsReport.columns}
                    title={`Informe_${type}`}
                />

            </div>

            <div className="SpaceReport" id="SpaceReport">

                {!loading && (
                    <TableReport
                        columns={settingsReport.columns}
                        info={tableData}
                        type={type}
                        searchValue={searchValue}
                        navigation={type === 'TR'}
                    />
                )}

                {loading && (
                    <LoadingSpace
                        title={"Cargando información"}
                        description={"Esto no debe tardar mucho..."}
                    />
                )}

            </div>

        </div>
    );
}
