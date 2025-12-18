import { useEffect, useState } from "react";
import { FormInput } from "../../components/FormInput";
import { SearchinList } from "../../components/SearchInList";
import { FormButton } from "../../components/FormButton"
import { BoldTitle } from "../../components/BoldTitle";
import './FormNewConcept.css'
import {NewElementSelect} from '../../components/NewElementSelect'
import { CardTitleLogo } from "../../components/CardTitleLogo";
import { postInfo } from "../../../../utils/functions";
import { useAlert, useAppInfo, useNotifications } from "../../../../context/context";
import { FormNewTax } from "./FormNewTax";

export function FormNewConcept({reloadInfo}){
    const {popOutAlert,popInAlert} = useAlert();
    const {addNotification} = useNotifications();
    const {appInfo} = useAppInfo();
    const [name,setName] = useState('');
    const [selectedAccount,setSelectedAccount] = useState();
    const [selectedTaxes,setSelectedTaxes] = useState([]);
    const [disabled,setsDisabled] = useState(false);
    const [loading,setLoading] = useState(false);
    const [accounts,setAccounts] = useState([]);
    const [taxes,setTaxes] = useState([]);

    const getAccounts = async()=>{
        let res = await postInfo('/getAccountsPlan',{
            company_id:appInfo.company_id,
            accountPlanId:appInfo.accountPlanId,
            accountPlanType:appInfo.accountPlanType
        })
        if(res[1][0]){
            let C = []
            res[1][1].forEach(element => {
                C.push({
                    text:`${element.code} - ${element.name}`,
                    value:element.id
                })
            });
            setAccounts(C)
        }
    }

    const getTaxes = async(attached)=>{
        console.log('Cargando Impuestos');
        let res = await postInfo('/getTaxes',{
            company_id:appInfo.company_id,
        })
        if(res[0]){
            let C = []
            res[1].forEach(element => {
                C.push({
                    text:element.name,
                    value:{
                        text:element.name,
                        value:element.tax_id
                    }
                })
            });
            setTaxes(C);
        }
    }


    const addTax = (newTax)=>{
        if(newTax != ''){
            let C = []
            selectedTaxes.map((element)=>{
                C.push(element)
            })
            if (!selectedTaxes.some(tax => tax === newTax)) {
                C.push(newTax)
            }
            setSelectedTaxes(C)
        }
    }

    const removeTax = (tax)=>{
        let C = []
        selectedTaxes.map((element)=>{
            if(element != tax){
                C.push(element)
            }
        })
        setSelectedTaxes(C)
    }

    const formInfo = {
        company_id:appInfo.company_id,
        name,
        account_id:selectedAccount,
        selectedTaxes
    }

    const createConcept = async()=>{
        setsDisabled(true);
        setLoading(true);
        let res = await postInfo('/createConcept',formInfo)
        if(res){
            addNotification({
                type:'aproved',
                title:'Nuevo Concepto creado',
                description:`El concepto "${name}" ha sido creado correctamente.`
            })
            popOutAlert();
            if(reloadInfo != undefined){
                reloadInfo();
            }
        }else{
            addNotification({
                type:'error',
                title:'Error al crear el nuevo concepto',
                description:`Ups, ocurrio un error al intentar crear el nuevo concepto, intentalo de nuevo.`
            })
        }
        setLoading(false);
        setsDisabled(false);
    }

    useEffect(()=>{
        getAccounts();
        getTaxes();
    },[])
    

    return(
        <div className="FormNewConcept">
                <BoldTitle text={'Nuevo Concepto'}/>
                <form className="createNewConcept" onSubmit={(e)=>{
                    e.preventDefault();
                    createConcept();
                }}>
                    <FormInput disabled={disabled} action={setName} title={'Nombre'} placeholder={'Nombre del nuevo concepto'}/>
                    <SearchinList disabled={disabled} action={setSelectedAccount} title={'Cuenta'} list={accounts} placeHolder={'Seleccionar Cuenta'} specialOption={
                        <NewElementSelect title={'Crear nueva cuenta'} onClick={()=>{popInAlert(<span>Formulario nueva cuenta</span>)}}/>
                    }/>
                    <SearchinList disabled={disabled} action={addTax} title={'Impuestos'} list={taxes} placeHolder={'Seleccionar Impuestos'} specialOption={
                        <NewElementSelect title={'Crear nuevo impuesto'} onClick={()=>{popInAlert(<FormNewTax/>)}}/>
                    } />
                    
                    <div className="selectedTaxesC">
                        <h5>Impuestos seleccinoados</h5>
                        {selectedTaxes.map((element,index)=>(
                            <CardTitleLogo onClick={()=>{
                                removeTax(element)
                            }} title={element.text} key={index}>
                                <i className="fa-solid fa-trash"/>
                            </CardTitleLogo>
                        ))}
                        {selectedTaxes.length == 0 && (
                            <span className="excepMess">No hay ningun impuesto seleccionado</span>
                        )}
                    </div>
                    <FormButton text={'Crear nuevo concepto'} disabled={disabled} loading={loading}/>
                </form>
        </div>
    )
}