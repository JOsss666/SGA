import { useAlert } from '../../../context/context'
import { ProgressBar } from '../components/ProgressBar';
import { ProcessStatusAlert } from './Alerts/ProcessStatusAlert';
import { formatDate } from '../../../utils/functions';
import { useMemo, useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import './TableReportProcesses.css'

export function TableReportProcesses({settingsReport,info,searchValue}){

    const {popInAlert} = useAlert();

    // filtro de búsqueda optimizado
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
        estimateSize: () => 55,
        overscan: 5
    });

    const handleElementRow = (column,info)=>{

        const elementsRow = {

            'ID': <span>{info.process_code}#{info.ownSerial}</span>,

            'Proceso': <span>{info.process_name}</span>,

            'Descripción': <span>{info.id}</span>,

            'Tercero': <span>{info.thirdParty_name}</span>,

            'Responsable': <span>{info.responsable_name ?? '---'}</span>,

            'Etapa': <span>{info.step_name}</span>,

            'Avance': (
                <ProgressBar
                    progress={((info.current_step_order/(info.total_steps - 1))*100).toFixed(1)}
                />
            ),

            'Fecha de entrega': <span>{formatDate(info.delivery_date)}</span>,

            'Fecha de inicio': <span>{formatDate(info.start_date)}</span>,

            'Ultima modificación': <span>{formatDate(info.updated_at)}</span>,

            'Estado': <span>{info.status}</span>

        }

        return elementsRow[column]

    }

    const virtualItems = rowVirtualizer.getVirtualItems();

    console.log("info length", info.length)
    console.log("filtered length", filteredInfo.length)

   return (
        <div className="TableReportProcesses">
            {/* Este es el único contenedor con SCROLL. 
                Maneja tanto el vertical (Virtualizer) como el horizontal (CSS).
            */}
            <div ref={parentRef} className="gridResultsTable">
                
                {/* Contenedor de ancho real. 
                   'min-width: 100%' asegura que el fondo cubra todo, 
                   y 'width: fit-content' permite que crezca según las columnas.
                */}
                <div style={{ width: 'fit-content', minWidth: '100%' }}>
                    
                    {/* Encabezado dentro del scroll para que se mueva en X */}
                    <div className="headTable">
                        {settingsReport.columns?.map((element) => (
                            <span className={`TH_${element}`} key={element}>
                                {element}
                            </span>
                        ))}
                    </div>

                    {/* Contenedor del virtualizador */}
                    <div
                        className="virtualContainer"
                        style={{
                            height: `${rowVirtualizer.getTotalSize()}px`,
                            width: '100%',
                            position: "relative"
                        }}
                    >
                        {virtualItems.map((virtualRow) => {
                            const rowInfo = filteredInfo[virtualRow.index];
                            if (!rowInfo) return null;

                            return (
                                <div
                                    key={virtualRow.key}
                                    className="virtualRow"
                                    style={{
                                        position: "absolute",
                                        top: 0,
                                        left: 0,
                                        width: '100%', // Ocupa el ancho del 'fit-content' de arriba
                                        height: `${virtualRow.size}px`,
                                        transform: `translateY(${virtualRow.start}px)`
                                    }}
                                >
                                    <div
                                        className={`RowResults rowStatus_${rowInfo.status}`}
                                        onClick={() => popInAlert(<ProcessStatusAlert instance_id={rowInfo.id} />)}
                                    >
                                        {settingsReport.columns?.map((element) => (
                                            <div key={element} className={`elementRow TH_${element}`}>
                                                {handleElementRow(element, rowInfo)}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}