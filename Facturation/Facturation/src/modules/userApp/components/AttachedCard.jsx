import './AttachedCard.css'

export function AttachedCard({info,deleteAct,hideOptions}){
    return(
        <div className="AttachedCard">
            {!hideOptions && (
                <div className="optionsAttached">
                    <div className="inconH" onClick={()=>{
                        if(deleteAct != undefined){
                            deleteAct(info.name)
                        }
                    }}>
                        <i className="fa-solid fa-trash-can"/>
                    </div>
                </div>
            )}
            {info.loading && (
                <div className="loadingAttached">
                    <i className="fa-solid fa-spinner"/>
                </div>
            )}
            <strong>{info.name}</strong>
        </div>
    )
}