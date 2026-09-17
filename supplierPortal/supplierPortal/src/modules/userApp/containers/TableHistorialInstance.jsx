import { useMemo, useRef } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import './TableCashBoxClose.css'
import { UserCard } from "../components/UserCard";
import { formatDate, moneyFormat } from "../../../utils/functions";
import { useAlert } from "../../../context/context";
import './TableHistorialInstance.css'

export function TableHistorialInstance({columns,info,searchValue,navigation}){
    const {popInAlert} = useAlert();
    const parentRef = useRef(null);
    const filteredInfo = useMemo(() => {
        if (!searchValue?.trim()) return info;

        const lower = searchValue.toLowerCase();

        return info.filter(row =>
            Object.values(row).some(val =>
                val?.toString().toLowerCase().includes(lower)
            )
        );
    }, [info, searchValue]);

    const rowVirtualizer = useVirtualizer({
        count: filteredInfo.length,
        getScrollElement: () => parentRef.current,
        estimateSize: () => 60,
        overscan: 6,
        getItemKey: index => index
    });

    console.log("INFO:", info.length)
    console.log("FILTERED:", filteredInfo.length)
    console.log("VIRTUAL:", rowVirtualizer.getVirtualItems())

    return(
        <div className="TableHistorialInstance">
            <div className="headTable">
                {columns.map((element,index)=>(
                    <span className="thTitle" key={index}>
                        {element}
                    </span>
                ))}
            </div>
            <div
                ref={parentRef}
                className="bodyTable"
            >
                <div
                    style={{
                        height: `${rowVirtualizer.getTotalSize()}px`,
                        width: "100%",
                        position: "relative"
                    }}
                >
                    {rowVirtualizer.getVirtualItems().map(virtualRow => {
                        const element = filteredInfo[virtualRow.index];
                        return (
                            <div
                                key={virtualRow.key}
                                data-index={virtualRow.index}
                                ref={rowVirtualizer.measureElement}
                                style={{
                                    position: "absolute",
                                    top: 0,
                                    left: 0,
                                    width: "100%",
                                    transform: `translateY(${virtualRow.start}px)`
                                }}
                            >
                                <div className="rowTable">
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
                            </div>
                        )
                    })}
                </div>
            </div>
        </div>
    )
}