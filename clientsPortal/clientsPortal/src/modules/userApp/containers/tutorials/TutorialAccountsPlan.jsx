import { useState } from "react";
import { BoldTitle } from "../../components/BoldTitle";
import { FormButton } from "../../components/FormButton";
import  './TutorialAccountsPlan.css'
import { FormInput } from "../../components/FormInput";
import { useAppInfo } from "../../../../context/context";
import { postInfo } from "../../../../utils/functions";

export function TutorialAccountsPlan(){

    const [stepForm,setStepForm] = useState(0);
    const [typePLan,setTypePlan] = useState();
    const [name,setName] = useState();
    const [disabled,setDisabled] = useState(false);
    const [loading,setLoading] = useState(false);
    const {appInfo,getAppData} = useAppInfo();


    const formInfo ={
        typePLan,
        name,
        company_id:appInfo.company_id
    }

    const createAccountPLan = async()=>{
        let res = await postInfo('/createAccountPlan',formInfo);
        console.log(res);
    }

    const insertAccounts = async()=>{
        let res = await postInfo('/createAccountPlan',formInfo);
        console.log(res);
    }

    const createPlan = async()=>{
        setDisabled(true)
        setLoading(true)
        //let s1 = await insertAccounts();
        let s2 = await createAccountPLan();
        setLoading(false)
        setDisabled(false)
        getAppData();
    }

    return(
        <div className="TutorialAccountsPlan appSection">
            <div className="contentTutoial">
                {stepForm == 0 && (
                    <div className="step0Tutorial">
                        <BoldTitle text={'Crea tu plan de cuentas'} />
                        <span>Crea o importa tu plan de cuentas para tu empresa.</span>
                        <FormButton disabled={disabled} onClick={()=>{
                            setStepForm(1)
                        }} text={'Comezar'}/>
                    </div>
                )}{stepForm == 1 && (
                    <div className="step1Tutorial">
                        <BoldTitle text={'Seleccióna el tipo de plan de cuentas'} />
                        <div className="gridTemplatesPlans">
                            <div onClick={()=>{
                                setTypePlan('PUC');
                                setStepForm(3);
                            }} className="cardTemplatePlan">
                                <div className="optionsCardTemplate">
                                    <i className="fa-brands fa-youtube"/>
                                </div>
                                <h4>PUC  
                                    <div className="ColombiaFlag">
                                        <div></div>
                                        <div></div>
                                        <div></div>
                                    </div>
                                </h4>
                                <span><a href="https://puc.com.co/plan-unico-de-cuentas-para-comerciantes" target="N_BLANK">Plan unico de cuentas <i className="fa-solid fa-arrow-up-right-from-square"/></a></span>
                                <p>Plan de cuentas oficial de Colombia, usado como estándar contable.</p>
                            </div>
                            <div onClick={()=>{
                                setTypePlan('Personalized');
                                setStepForm(2.2);
                            }} className="cardTemplatePlan">
                                <div className="optionsCardTemplate">
                                    <i className="fa-solid fa-circle-info"/>
                                    <i className="fa-brands fa-youtube"/>
                                </div>
                                <h4>Personalizado</h4>
                                <span><a href="https://puc.com.co/plan-unico-de-cuentas-para-comerciantes" target="N_BLANK">¿Como crear un plan de cuentas? <i className="fa-solid fa-arrow-up-right-from-square"/></a></span>
                                <p>¿Ya tienes tu plan de cuentas o quieres crear uno nuevo? esta opcion es para ti.</p>
                            </div>
                        </div>
                        <FormButton disabled={disabled} negative={true} text={'Volver'} onClick={()=>{
                            setStepForm(0)
                        }} />
                    </div>
                )}
                {stepForm == 2.2 && typePLan == 'Personalized' && (
                    <div className="step2_2tutorial">
                        <BoldTitle text={'Plan de cuentas propio'} />
                        <div className="gridTemplatesPlans">
                            <div onClick={()=>{
                                setTypePlan('PUC');
                                setStepForm(2.21);
                            }} className="cardTemplatePlan">
                                <div className="optionsCardTemplate">
                                    <i className="fa-brands fa-youtube"/>
                                </div>
                                <h4>Migrar plan <i className="fa-solid fa-cloud-arrow-up"/></h4>
                                <span><a href="https://puc.com.co/plan-unico-de-cuentas-para-comerciantes" target="N_BLANK">¿Como descargar plan de cuentas? <i className="fa-solid fa-arrow-up-right-from-square"/></a></span>
                                <p>¿Ya tienes un plan de cuentas? descargalo y subelo a nuestra plataforma.</p>
                            </div>
                            <div onClick={()=>{
                                setTypePlan('Personalized');
                                setStepForm(2.22);
                            }} className="cardTemplatePlan">
                                <div className="optionsCardTemplate">
                                    <i className="fa-solid fa-circle-info"/>
                                    <i className="fa-brands fa-youtube"/>
                                </div>
                                <h4>Crear nuevo plan <i className="fa-solid fa-plus"/></h4>
                                <span><a href="https://puc.com.co/plan-unico-de-cuentas-para-comerciantes" target="N_BLANK">¿Como crear un plan de cuentas? <i className="fa-solid fa-arrow-up-right-from-square"/></a></span>
                                <p>Empieza desde cero y parametriza tu plan de cuentas a tus necesidades.</p>
                            </div>
                        </div>
                        <FormButton disabled={disabled} negative={true} text={'Volver'} onClick={()=>{
                            setStepForm(1)
                        }} />
                    </div>
                )}
                {stepForm == 3 && (
                    <div className="step3Tutorial">
                        <BoldTitle text={'Nombra tu plan de cuentas'}/>
                        <FormInput action={setName} disabled={disabled} placeholder={'Nombre de tu plan de cuentas'}/>
                        <FormButton disabled={disabled} loading={loading} text={'Crear plan de cuentas'} onClick={()=>{
                            createPlan();
                        }} />
                    </div>
                )}
            </div>            
        </div>
    )
}