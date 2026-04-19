import { CheckSquare } from "../components/CheckSquare";
import { RowTableReport } from "../components/RowTableReport";
import { NoResults } from "./NoResults";
import { useMemo, useRef } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import "./TableReport.css";

export function TableReport({ columns, info, type, searchValue, navigation, summaryValues }) {

    // Filtrado optimizado
    const filteredInfo = useMemo(() => {
        if (!searchValue?.trim()) return info;

        const lower = searchValue.toLowerCase();

        return info.filter(row =>
            Object.values(row).some(val =>
                val?.toString().toLowerCase().includes(lower)
            )
        );
    }, [info, searchValue]);

    // referencia del contenedor scroll
    const parentRef = useRef(null);

    // virtualizador
    const rowVirtualizer = useVirtualizer({
        count: filteredInfo.length,
        getScrollElement: () => parentRef.current,
        estimateSize: () => 50, // altura aproximada de cada fila
        overscan: 5
    });

    return (
        <div className={`TableReport ${summaryValues ? "TableReport_withSummary" : ""}`}>
            {summaryValues && (
                <div className="summaryTable">
                    <span className="summaryCheckSpace">
                        <CheckSquare />
                    </span>

                    {columns.map((element, index) => (
                        <span
                            className={`summaryColumn summaryColum_${element} headColum_${element}`}
                            key={index}
                            title={summaryValues[element] || ""}
                        >
                            {summaryValues[element] || ""}
                        </span>
                    ))}
                </div>
            )}

            {/* HEADER */}
            <div className="headTable">
                <span>
                    <CheckSquare />
                </span>

                {columns.map((element, index) => (
                    <span
                        className={`headColumn headColum_${element}`}
                        key={index}
                    >
                        {element}
                    </span>
                ))}
            </div>

            {/* BODY */}
            {filteredInfo.length > 0 ? (
                <div
                    ref={parentRef}
                    className="bodyTable"
                    style={{
                        height: "500px",
                        overflowY: "auto"
                    }}
                >
                    <div
                        style={{
                            height: `${rowVirtualizer.getTotalSize()}px`,
                            width: "100%",
                            position: "relative"
                        }}
                    >
                        {rowVirtualizer.getVirtualItems().map((virtualRow) => {

                            const element = filteredInfo[virtualRow.index];

                            return (
                                <div
                                    key={virtualRow.key}
                                    style={{
                                        position: "absolute",
                                        top: 0,
                                        left: 0,
                                        width: "100%",
                                        transform: `translateY(${virtualRow.start}px)`
                                    }}
                                >
                                    <RowTableReport
                                        type={type}
                                        columns={columns}
                                        info={element}
                                        navigation={navigation}
                                    />
                                </div>
                            );
                        })}
                    </div>
                </div>
            ) : (
                <div className="bodyTable">
                    <NoResults title={"No hay resultados disponibles"} />
                </div>
            )}

        </div>
    );
}
