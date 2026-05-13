import { useEffect, useState } from "react"
import { postInfo, showAPITaxes } from "../../../../utils/functions";
import { useAppInfo, useNotifications } from "../../../../context/context";
import './FormInvoice.css'
import { BoldTitle } from "../../components/BoldTitle";
import { executeDocumentAction } from "../../../../utils/DocumentsControl";
import { FormButton } from "../../components/FormButton";

export function FormInvoice({info,update}){
    
    // Requirements
    const {appInfo} = useAppInfo();

    // Control
    const [docRules,setDocRules] = useState([]);
    const [loading,setLoading] = useState(false);
    const [disabled,setDisabled] = useState(false);
    const [error,setError] = useState(``);
    const [visibleError,setVisibleError] = useState(false);

    // Enviroment variables
    const [thirdPartyInfo,setThirdPartyInfo] = useState({});
    const [paymentMethods,setPaymentMethods] = useState([]);
    const [selectedInstances, setSelectedInstances] = useState([]);

    // Form fields
    const [thirdParty_id,setThirdParty_id] = useState();
    const [bussines_id,setBussines_id] = useState();
    const [store_id,setStore_id] = useState();
    const [costCenter_id,setCostCenter_id] = useState();
    const [paymentMethod_code, setPaymentMethod_code] = useState();
    const [total,setTotal] = useState(0);
    const [description,setDescription] = useState();
    const [attached,setAttached] = useState('-');
    const [concept_id,setConcept_id] = useState();
    const [conceptAccount_id,setConcept_account_id] = useState();
    const [cashBox_id,setCashBox_id] = useState();
    const [shift_id,setShift_id] = useState();
    const [status,setStatus] = useState('active');

    // FormInfo
    const formInfo = {
        thirdParty_id,
        bussines_id,
        store_id,
        costCenter_id,
        paymentMethod_code,
        total,
        subTotal:total,
        description,
        attached,
        concept_id,
        conceptAccount_id,
        cashBox_id,
        shift_id,
        status
    };

    
    // Getters functions
    const getDocumentRules = async()=>{
        let res = await postInfo('/getDocParams',{
            company_id:appInfo.company_id,
            docType:'Sell Invoice'
        })
        if(res.status == 'OK'){
            setDocRules(res.data);
        }
    }

    // Utils
    const validateDocument = async()=>{
        if(docRules.length == 0){
            setDisabled(true)
            console.warn('Documento sin parametrizar')
        }
        for (const rule of docRules){
            let res = await executeDocumentAction(rule.action,formInfo)
            console.log(res)
            if(res.isValid == false){
                setError(`Error de validación: ${res.message}`)
                setVisibleError(true);
                break
            }
        }
    }

    useEffect(()=>{
        getDocumentRules();
    },[])

    return(
        <div className="FormInvoice">
            <BoldTitle text={'Factura de venta'}/>
            {visibleError && (
                <div className="errorContainer">
                    <span>{error}</span>
                    <i title="Ocultar advertencia" className="fa-solid fa-xmark closeErrorBtn" onClick={()=>{
                        setVisibleError(false);
                    }}/>
                </div>
            )}
            <form onSubmit={(e)=>{
                e.preventDefault();
                validateDocument();
            }}>
                <FormButton>Validar factura</FormButton>
            </form>
        </div>
    )
}