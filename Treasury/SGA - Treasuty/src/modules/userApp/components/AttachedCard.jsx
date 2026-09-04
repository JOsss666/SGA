import './AttachedCard.css'

export function AttachedCard({info,deleteAct,hideOptions}){
    return(
        <div className="AttachedCard" title={info.name}>
            {info.preview && (
                <img src={info.preview} alt={`Vista previa de ${info.name}`}/>
            )}
            {!hideOptions && (
                <div className="optionsAttached">
                    <button type="button" className="inconH" aria-label={`Eliminar ${info.name}`} onClick={()=>{
                        if(deleteAct != undefined){
                            deleteAct(info.name)
                        }
                    }}>
                        <i className="fa-solid fa-xmark" aria-hidden="true"/>
                    </button>
                </div>
            )}
            {info.loading && (
                <div className="loadingAttached">
                    <i className="fa-solid fa-spinner"/>
                </div>
            )}
        </div>
    )
}
