import { useMemo } from "react";
import './TableCashBoxClose.css'
import { UserCard } from "../components/UserCard";
import { formatDate, moneyFormat } from "../../../utils/functions";
import { useAlert } from "../../../context/context";
import { CashRegisterReport } from "./reports/CashRegisterReport";

export function TableCashBoxClose({columns,info,searchValue,navigation}){
    const {popInAlert} = useAlert();
    const filteredInfo = useMemo(() => {
        if (!searchValue?.trim()) return info;

        const lower = searchValue.toLowerCase();

        return info.filter(row =>
            Object.values(row).some(val =>
                val?.toString().toLowerCase().includes(lower)
            )
        );
    }, [info, searchValue]);

    return (
    <div className="TableCashBoxClose">
        {/* Contenedor que manejará el scroll horizontal y vertical */}
        <div className="gridResultsTable">
            {/* Div interno que fuerza el ancho real según el contenido */}
            <div style={{ width: 'fit-content', minWidth: '100%' }}>
                {/* Encabezado */}
                <div className="headTable">
                    {columns.map((element, index) => (
                        <span className="thTitle" key={index}>
                            {element}
                        </span>
                    ))}
                </div>

                {/* Cuerpo de la tabla */}
                <div className="bodyTable">
                    {filteredInfo.map((element, index) => (
                        <div className="rowTable" key={index} onClick={() => {
                            popInAlert(<CashRegisterReport shift_id={element.id} />);
                        }}>
                            <UserCard name={element.responsable} desc={'responsable'} imgSrc={element.user_img} />
                            <span className="rowElement">{element.cashBox_name}</span>
                            <span className="rowElement rightAl">{moneyFormat(parseFloat(element.initialBalance))}</span>
                            <span className="rowElement rightAl">{moneyFormat(parseFloat(element.actual_balance))}</span>
                            <span className="rowElement rightAl">{moneyFormat(parseFloat(element.expectedBalance))}</span>
                            <span className="rowElement">{formatDate(element.opening_time)}</span>
                            <span className="rowElement">{formatDate(element.opening_time)}</span>
                            <span className="rowElement">{element.status}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    </div>
);
}