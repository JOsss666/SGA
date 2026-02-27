import { useMemo } from "react";
import './TableCashBoxClose.css'
import { UserCard } from "../components/UserCard";
import { formatDate, moneyFormat } from "../../../utils/functions";
import { useAlert } from "../../../context/context";
import { CashRegisterReport } from "./reports/CashRegisterReport";
import './TableHistorialInstance.css'

export function TableHistorialInstance({columns,info,searchValue,navigation}){
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

    return(
        <div className="TableHistorialInstance">
            <div className="headTable">
                {columns.map((element,index)=>(
                    <span className="thTitle" key={index}>
                        {element}
                    </span>
                ))}
            </div>
            <div className="bodyTable">
                {filteredInfo.map((element,index)=>(
                    <div className="rowTable" key={index}>
                        <span className="rowElement">{element.process_name}</span>
                        <span className="rowElement idHolder">{`${element.process_code}#${element.instance_id}`}</span>
                        <UserCard name={element.user_name} imgSrc={element.user_img}/>
                        <div className="advanceStepContainer">
                            <div className="stepBuble prevStep" title={element.prevstep_name}>
                                <span>{element.prevstep_name}</span>
                            </div>
                            <i className="fa-solid fa-arrow-right flowIndicator"/>
                            <div className="stepBuble actualStep" title={element.nextstep_name}>
                                <span>{element.nextstep_name}</span>
                            </div>
                        </div>
                        <span className="rowElement ">{element.description? element.description:'---'}</span>
                        <span className="rowElement ">{formatDate(element.created_at)}</span>
                        <span className="rowElement ">{element.status}</span>
                    </div>
                ))}
            </div>
        </div>
    )
}