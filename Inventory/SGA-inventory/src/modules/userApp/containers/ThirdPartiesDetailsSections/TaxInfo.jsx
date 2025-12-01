import { InputFiles } from "../../components/InputFiles";
import { SelectOptions } from "../../components/SelectOptions";
import { LabelValue } from "../../components/LabelValue";
import './TaxInfo.css'
import { FileInput } from "../../components/FileInput";

export function TaxInfo({info}){
    return(
        <div className="TaxInfo">
            <div className="paramsContainer">
                <form action="">
                    <div className="SelOp">
                        <h6>Régimen</h6>
                        <SelectOptions options={[
                            'Ordinario',
                            'Simple',
                            'No Contribuyente',
                            'No declarante',
                            'Gran contribuyente',
                            'Regimen especial o exento'
                        ]}/>
                    </div>
                    <div className="SelOp">
                        <h6>Responsabilidad frente al IVA</h6>
                        <SelectOptions options={[
                            '48 -Responsable de IVA',
                            '49 - No responsable de IVA',
                            '50 - Responsable de IVA por importación de servicios',
                            '51 - Responsable de IVA en servicios digitales desde el exterior',
                            '52 - No responsable de IVA por operaciones no gravadas o excluidas',
                            '53 - Responsable del IVA régimen simple',
                            '54 - Responsable del IVA por ventas ocasionales de activos gravados'
                        ]}/>
                    </div>
                    <div className="SelOp">
                        <h6>Agente retenedor</h6>
                        <SelectOptions options={[
                            '05 - Agente de retención en la fuente a título de renta',
                            '06 - Agente de retención de IVA',
                            '07 - Agente de retención de timbre nacional',
                            '08 - Autorretenedor del impuesto sobre la renta',
                            '09 - Agente de retención  ICA (distrital o municipal)',
                            '10 - Agente de retención SIMPLE',
                            '11 - No es agente retenedor'
                        ]}/>
                    </div>
                    <LabelValue title={'Actividad Economica'} value={'0111 Cultivo de cereales'}/>
                </form>
            </div>
            <div className="attachedDocumentsContainer">
                <h6>Documentos Adjuntos</h6>
                <div className="attachedDocsGrid">
                    <div className="RutContainer">
                        <div className="actualRut">
                            {info.attachedRout == undefined && (
                                <div className="noRutAttached">
                                    <i className="fa-solid fa-ghost"/>
                                    <h6>
                                        No has adjuntado ningun Rut
                                    </h6>
                                </div>
                            )}
                        </div>
                        <FileInput placeholder={'Seleccionar nuevo RUT'}/>
                    </div>
                </div>
            </div>
        </div>
    )
}