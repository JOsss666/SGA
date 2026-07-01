import { useEffect, useState } from "react";
import { BoldTitle } from "../../components/BoldTitle";
import { FormInput } from "../../components/FormInput";
import { useAppInfo, useNotifications } from "../../../../context/context";
import { SearchinList } from "../../components/SearchInList";
import './FormNewBudget.css'
import { FormButton } from "../../components/FormButton";
import { InputFiles } from "../../components/InputFiles";
import { FileInput } from "../../components/FileInput";
import { SelectOptions } from "../../components/SelectOptions";
import { postInfo } from "../../../../utils/functions";
import { executeDocumentAction } from "../../../../utils/DocumentsControl";

export function FormNewBudget({info,update,updateInfo = {},reloadFun}){

    // Requirements
    const {appInfo,userInfo, userConfig} = useAppInfo();
    const {addNotification} = useNotifications();

    // Control
    const [disabled,setDisabled] = useState(false);
    const [loading,setLoading] = useState(false);
    const [error,setError] = useState('');
    const [instances,setInstances] = useState([]);
    const [thirdparties,setThirdParties] = useState([]);

    // FormInfo
    const [name,setName] = useState('');
    const [thirdPartyInfo,setThirdPartyInfo] = useState({});
    const [thirdParty_id,setThirdParty_id] = useState(undefined);
    const [budgetCost,setBudgetCost] = useState(0);
    const [budegetIncome,setBudgetIncome] = useState(0);
    // Instances
    const [instance_id,setInstance_id] = useState(undefined);
    const [instanceInfo,setInstanceInfo] = useState(undefined);
    const [step_id,setStep_id] = useState(undefined);
    const [instance_ownSerial,setInstanceOwnSerial] = useState();
    //
    const [description,setDescription] = useState('');
    const [currency,setCurrency] = useState('COP');
    const [documentDate,setDocumentDate] = useState(undefined);
    const [validUntil,setValidUntil] = useState(undefined);
    const [attached,setAttached] = useState('');

    const formInfo = {
        thirdParty_id,
        instance_id,
        step_id,
        description,
        currency,
        specialConfig:{
            name,
            budgetCost,
            budegetIncome,
            documentDate,
            validUntil
        },
        attached
    };

    // handlers

    const handleThirdPartyChange = (element)=>{
        setThirdParty_id(element.id);
        setThirdPartyInfo(element);
    }

    const handleSelectInstance = (element) => {
        if (!element.id) return;
        setStep_id(element.step_id);
        setInstanceOwnSerial(element.ownSerial);
        setThirdParty_id(element.thirdParty_id);
    };

    // Getters of info

    const getDocumentRules = async()=>{
        let res = await postInfo('/getDocParams',{
            company_id:appInfo.company_id,
            docType:'Sell Invoice'
        })
        if(res.status == 'OK'){
            setDocRules(res.data);
        }
    }

    const getDocuments = async(instance_id)=>{
        let res = await postInfo('/getDocuments',{
            company_id:appInfo.company_id,
            instance_id,
            thirdParty_id,
            status:'active',
            // Arreglo temporal de tipo de documentos
            allowedTypes:['Client Order']
        })
        if(res[0]){
            if(instance_id == undefined){
                let C = []
                res[1].forEach(element => {
                    C.push({
                        text:`${element.document_type}#${element.ownSerial}`,
                        value:element
                    })
                });
                setDocuments(C);
            }else{
                for (const element of res[1]) {
                    let attachedItems = await getAttachedServices(element.id);
                    handleAddBlock({
                        docInfo: element,
                        items: attachedItems
                    });
                }
            }
        }
    }



    // Creation Actions

    const validateDocument = async()=>{
        if(docRules.length == 0){
            setDisabled(true)
            console.warn('Documento sin parametrizar')
        }
        for (const rule of docRules){
            let res = await executeDocumentAction(rule.action,formInfo)
            if(res.isValid == false){
                setError(`Error de validación: ${res.message}`)
                setVisibleError(true);
                break
            }
        }
    }

    const getInstances = async(allowedInstances,allowedTypes)=>{
        let res = await postInfo('/process/getProcessInstances',{
            company_id:appInfo.company_id,
            status:['active'],
            thirdParty_id,
            id:info.instance_id
        })
        console.log(res);
        if(res[0]){
            let C = [];
            res[1].forEach(element => {
                C.push({
                    text:`${element.process_code}#${element.ownSerial}`,
                    value:element
                })
            });
            if(C.length == 1){
                handleSelectInstance(C[0].value);
            }
            setInstances(C);
        }
    }


    // Events Controllers

    useEffect(()=>{
        console.log(info)
        getInstances();
    },[])



    return(
        <div className="FormNewBudget">
            <BoldTitle text={updateInfo? 'Nuevo Presupuesto':`Actialización ${updateInfo.name}`}/>
            <form action="" onSubmit={(e)=>{
                e.preventDefault();
            }}>
                <FormInput title={'Titulo'} placeholder={'Presupuesto A#12...'} action={setName} disabled={disabled}/>
                {info.instance_id == undefined && (
                    <SearchinList title={'Proceso adjunto'} list={instances} action={handleSelectInstance} placeHolder={'Seleccione el proceso'} disabled={disabled}/>
                )}
                {thirdParty_id == undefined && (
                    <SearchinList title={'Cliente'} list={[]} action={setThirdPartyInfo} placeHolder={'Seleccione el cliente'} disabled={disabled}/>
                )}
                <FormInput title={'Costo presupuestado'} type={'value'} disabled={disabled} action={setDescription} placeholder={'0'}/>
                <FormInput title={'Ingreso presupuestado'} type={'value'} disabled={disabled} action={setDescription} placeholder={'0'}/>
                <FormInput title={'Descripción'} disabled={disabled} textArea={true} action={setDescription} placeholder={'Describe tu proyecto... '}/>
                <SearchinList title={'Moneda'} placeHolder={'Seleccione la moneda'} action={setCurrency} list={[
                    {text:'COP', value:'COP'},
                    {text:'USD', value:'USD'},
                    {text:'EUR', value:'EUR'}
                ]}/>
                <SelectOptions objectC={true} disabled={disabled} title={'Estado'} defaultValue={{text:'Confirmado',value:'active'}} options={[
                    {text:'Confirmado',value:'active'},
                    {text:'Pendiente',value:'draft'},
                    {text:'Cancelado',value:'Disabled'},
                ]}/>
                <FormInput action={setDocumentDate} title={'Fecha del documento'} type={'date'} disabled={disabled}/>
                <FormInput action={setValidUntil} title={'Valido hasta'} type={'date'} disabled={disabled}/>
                <FileInput action={setAttached} disabled={disabled}/>
                <FormButton text={update? 'Actualizar':'Crear presupuesto'}/>
            </form>
        </div>
    )
}