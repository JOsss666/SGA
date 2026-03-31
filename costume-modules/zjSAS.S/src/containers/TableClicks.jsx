import './TableClicks.css'
import {UserCard} from '../components/UserCard'
import { moneyFormat } from '../../utils/functions'
import {PreviewFile} from './Preview/PreviewFile'
import { useRef } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'

export function TableClicks({columns,info,disabled, useAlert, appInfo}){

    const {popInAlert} = useAlert()

    const parentRef = useRef(null)

    const rowVirtualizer = useVirtualizer({
        count: info.length,
        getScrollElement: () => parentRef.current,
        estimateSize: () => 70, // altura estimada de cada fila
        overscan: 5
    })

    const extractIdFromAttached = (attachedValue) => {
        try {

            if (!attachedValue) return null

            let data = attachedValue

            if (typeof data === 'string') {

                let cleanStr = data.trim()

                if (cleanStr.startsWith('{"{')) {
                    cleanStr = cleanStr.substring(1, cleanStr.length - 1)
                }

                let safetyCounter = 0

                while (typeof cleanStr === 'string' && safetyCounter < 5) {

                    try{
                        cleanStr = JSON.parse(cleanStr)
                    }catch{
                        cleanStr = JSON.parse(cleanStr.replace(/\\"/g,'"'))
                    }

                    safetyCounter++
                }

                data = cleanStr
            }

            if (Array.isArray(data) && data.length > 0) {
                return data[0].id ? String(data[0].id) : null
            }

            if (data && data.id) {
                return String(data.id)
            }

            return null

        } catch (error) {

            console.error("Error al extraer ID del attached:", error)
            return null
        }
    }

    const virtualItems = rowVirtualizer.getVirtualItems()

    return(

        <div className="TableClicks">

            <div className="headTable">
                {columns.map((element)=>(
                    <span className="thTitle" key={element}>
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
                        position: "relative"
                    }}
                >

                    {virtualItems.map((virtualRow)=>{

                        const element = info[virtualRow.index]

                        return(

                            <div
                                key={virtualRow.key}
                                style={{
                                    position:"absolute",
                                    top:0,
                                    left:0,
                                    width:"100%",
                                    height:`${virtualRow.size}px`,
                                    transform:`translateY(${virtualRow.start}px)`
                                }}
                            >

                                <div
                                    className="rowClicks"
                                    onClick={()=>{

                                        popInAlert(
                                            <PreviewFile
                                                id={extractIdFromAttached(element.attached)}
                                                useAlert={useAlert}
                                                appInfo={appInfo}
                                            />
                                        )

                                    }}
                                >

                                    <UserCard
                                        name={element.asset_name}
                                        desc={element.asset_model}
                                        imgSrc={element.asset_img}
                                    />

                                    <span className='rowTable'>
                                        {moneyFormat(parseInt(element.initialClicks))}
                                    </span>

                                    <span className='rowTable'>
                                        {element.responsable}
                                    </span>

                                    <span className='rowTable'>
                                        {element.description}
                                    </span>

                                    <span className='rowTable'>
                                        {element.created_at ? element.created_at.substring(0,16) : '---'}
                                    </span>

                                </div>

                            </div>

                        )

                    })}

                </div>

            </div>

        </div>
    )
}