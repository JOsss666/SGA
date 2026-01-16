import { BoldTitle } from "../components/BoldTitle";
import { DescriptionSpan } from "../components/DescriptionSpan";
import { SearchBar } from "../components/SearchBar";
import { SelectOptions } from "../components/SelectOptions";
import { FormInput } from "../components/FormInput";
import { useEffect, useState } from "react";
import { useAppInfo } from "../../../context/context";
import { ButtonMenu } from "../components/ButtonMenu";
import { AiButton } from "../components/ChatAiComponents/AiButton";
import { ButtonDownload } from "../components/ButtonDownload";
import { TableReport } from "./TableReport";
import "./Payments.css";
import { Titles } from "../../../../../../Inventory/SGA-inventory/src/modules/LandingPage/components/Titles";


    const DataEjemplo = [
        {
            id: 1,
            fecha_documento: "2025-01-10",
            tercero: "Proveedor A",
            tipo_documento: "Factura",
            concepto: "Compra de insumos",
            tienda: "Tienda Norte",
            negocio: "Retail",
            centro_costo: "Operaciones",
            subtotal: 150000,
            valor: 178500,
        },
        {
            id: 2,
            fecha_documento: "2025-01-12",
            tercero: "Proveedor B",
            tipo_documento: "Cuenta de cobro",
            concepto: "Servicios",
            tienda: "Tienda Centro",
            negocio: "Servicios",
            centro_costo: "Administración",
            subtotal: 320000,
            valor: 320000,
        },
    ];

    export function Payments() {
        const [info, setInfo] = useState([]);
        const { appInfo } = useAppInfo();
        const [searchValue, setSearchValue] = useState("");
        const [loading, setLoading] = useState(false);


        const valuesCard = {
            paidValue: 1200000,
            totalValue: 5300000,
        };

        const formatCurrency = (value) =>
            new Intl.NumberFormat("es-CO").format(value);

        const percentage = Math.round(
            (valuesCard.paidValue / valuesCard.totalValue) * 100
        );

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

        /* BACKEND DESACTIVADO */
        /*
        const GetDocuments = async () => {
            setLoading(true);
            let res = await postInfo('/getDocuments', settingsReport);
            if (res[0]) {
            setInfo(res[1]);
            }
            setLoading(false);
        };

        useEffect(() => {
            GetDocuments();
        }, []);
        */


        useEffect(() => {
            setInfo(DataEjemplo);
        }, []);

        return (
            <div className="Payments">
                <div className="SidebarLeft">
                    <div className="TitleSidebar">
                        <BoldTitle text="Payments" />
                        <DescriptionSpan text="Administra tus cuentas por pagar" />
                    </div>
                    <div className="CardPayments">
                        <div className="Progress">
                            <span>{percentage}%</span>
                        </div>
                        <div className="Text">
                            <BoldTitle text="Valor pagado" />
                            <DescriptionSpan text={`$ ${formatCurrency(valuesCard.paidValue)} / $ ${formatCurrency(valuesCard.totalValue)}`} />
                        </div>
                    </div>
                    <div className="OptionsSidebarLeft">
                        
                        <button className="Button primary">
                            <i className="fa-solid fa-plus" />
                            Nuevo pago
                        </button>
                        <button className="Button primary">
                            <i className="fa-solid fa-plus" />
                            Nueva vuenta por pagar
                        </button>

                        <button className="Button secondary">
                            <i className="fa-solid fa-bars" />
                            Cuentas por pagar
                        </button>
                        <button className="Button secondary">
                            <i className="fa-solid fa-bars" />
                            Estadisticas
                        </button>
                        <button className="Button secondary">
                            <i className="fa-solid fa-bars" />
                            Historial de pagos
                        </button>
                        <button className="Button secondary">
                            <i className="fa-solid fa-bars" />
                            Informes
                        </button>
                    </div>

                </div>

                <div className="SideBarRight">
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

                        <ButtonMenu
                            title={"Mas Ajustes"}
                            noRotate={true}
                        >
                            <i className="fa-solid fa-sliders" />
                        </ButtonMenu>

                        <ButtonMenu
                            title={"Agregar a favoritos"}
                            noRotate={true}
                        >
                            <i className="fa-regular fa-star" />
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
            </div>
        );
}
