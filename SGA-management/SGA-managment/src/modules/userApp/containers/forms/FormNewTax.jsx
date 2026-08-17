import { useEffect, useState } from "react";
import { FormInput } from "../../components/FormInput";
import { SearchinList } from "../../components/SearchInList";
import { FormButton } from "../../components/FormButton";
import { BoldTitle } from "../../components/BoldTitle";
import './FormNewTax.css';
import { NewElementSelect } from '../../components/NewElementSelect';
import { postInfo } from "../../../../utils/functions";
import { useAlert, useAppInfo, useNotifications } from "../../../../context/context";
import { SwitchOption } from "../../components/SwitchOption";

export function FormNewTax({reloadInfo,info}){
    if(info == undefined){
        info = {}
    }
    const {addNotification} = useNotifications();
    const {appInfo} = useAppInfo();
    const {popOutAlert} = useAlert();
    const [accounts, setAccounts] = useState([]);
    const [categories,setCategories] = useState([]);
    const [fiscalTypes,setFiscalTypes] = useState([]);
    const [fiscalTaxId,setFiscalTaxId] = useState();
    const [isRetention,setIsRetention] = useState(false);

    // Control
    const [disabled, setDisabled] = useState(false);
    const [loading, setLoading] = useState(false);

    // Form Info
    const [code, setCode] = useState('');
    const [rate, setRate] = useState('');
    const [selectedAccount, setSelectedAccount] = useState();
    const [parent_id,setParent_id] = useState(info.id != undefined? info.id:0);
    const [path,setPath] = useState(info.path != undefined? info.path:'/');
    const [base,setBase] = useState(0);
    const [type,setType] = useState('sell');
    
    const formInfo = {
        company_id: appInfo.company_id,
        code: code,
        rate: parseFloat(rate),
        base,
        parent_id,
        account_id: selectedAccount,
        company_id:appInfo.company_id,
        path:path,
        isRetention,
        type,
        fiscal_tax_id:fiscalTaxId
    };

    const getAccounts = async () => {
        let res = await postInfo('/getAccountsPlan', {
            company_id:appInfo.company_id,
            accountPlanId:appInfo.accountPlanId,
            accountPlanType:appInfo.accountPlanType
        })
        if(res[1][0]){
            let accountsList = [];
            res[1][1].forEach(element => {
                accountsList.push({
                    text: `${element.code} - ${element.name}`,
                    value: element.id
                })
            });
            setAccounts(accountsList);
        }
    }
    
    const getCategories = async()=>{
        setLoading(true);
        setDisabled(true);
        let res = await postInfo('/getTaxCategories',{
            company_id:appInfo.company_id
        })
        if(res[0]){
            let C = [];
            res[1].forEach(element => {
                let level = (element.path.split('/')).length -1;
                const indent = "\t".repeat(level);
                C.push({
                    text:`${indent}${element.name}`,
                    value:`${element.id}&&${element.path}/`
                })
            });
            setCategories(C)
        }
        setLoading(false);
        setDisabled(false);
    }

    // Trae las familias/tipos fiscales estándar según el país (por ahora fijo Colombia).
    const getFiscalTypes = async()=>{
        let res = await postInfo('/getFiscalTaxTypes',{
            country:'Colombia'
        })
        console.log('res habilitados: ',res)
        if(res[0]){
            let C = [];
            res[1].forEach(element => {
                C.push({
                    text:`${element.code} - ${element.name}`,
                    value:element.id
                })
            });
            setFiscalTypes(C);
        }
    }

    const setIdentationAndId = (text)=>{
        let data = text.split('&&');
        if(data[0] == ''){
            if(info != undefined && info.id != undefined){
                setParent_id(info.id)
                setPath(`${info.path}/${info.name}/`);
            }else{
                setParent_id(0)
                setPath('/')
            }
        }else{
            setParent_id(data[0] != ''? data[0]:0);
            setPath(data[1] != undefined? data[1]:'/');
        }
    }

    
    const createTax = async () => {
        setDisabled(true);
        setLoading(true);
        let res = await postInfo('/createTax', formInfo);
        if(res){
            addNotification({
                type: 'aproved',
                title: 'Nuevo Impuesto creado',
                description: `El impuesto ha sido creado correctamente.`
            });
            popOutAlert();
            if(reloadInfo != undefined){
                reloadInfo();
            }
        } else {
            addNotification({
                type: 'error',
                title: 'Error al crear el nuevo impuesto',
                description: `Ups, ocurrió un error al intentar crear el nuevo impuesto, inténtalo de nuevo.`
            });
        }
        setLoading(false);
        setDisabled(false);
    }

    useEffect(() => {
        getAccounts();
        getCategories();
        getFiscalTypes();
    }, []);

    return(
        <div className="FormNewTax">
            <BoldTitle text={'Nuevo Impuesto'}/>
            <form className="createNewTax" onSubmit={(e) => {
                e.preventDefault();
                console.log(formInfo)
                createTax();
            }}>
                <FormInput 
                    action={setCode} 
                    title={'Código'} 
                    disabled={disabled}
                    placeholder={'Código del impuesto'}
                />
                <FormInput 
                    action={setRate} 
                    title={'Tasa'} 
                    disabled={disabled}
                    placeholder={'Tasa del impuesto'}
                    type="number"
                    step="0.001"
                />
                <FormInput 
                    moneyF={true}
                    action={setBase} 
                    title={'Base'} 
                    type={'number'}
                    disabled={disabled}
                    placeholder={'A partir de '}
                />
                <SearchinList
                    title={'Categoria'}
                    action={setIdentationAndId}
                    disabled={disabled}
                    placeHolder={path !='/' ? path:'/..'}
                    list={categories}/>
                <SearchinList 
                    action={setSelectedAccount} 
                    title={'Cuenta'} 
                    list={accounts}
                    disabled={disabled}
                    placeHolder={'Seleccionar Cuenta'}
                    specialOption={
                        <NewElementSelect title={'Crear nueva cuenta'}/>
                    }
                />
                <SearchinList
                    title={'Tipo'}
                    placeHolder={'Seleccione el tipo'}
                    disabled={disabled}
                    action={setFiscalTaxId}
                    list={fiscalTypes}/>
                <SearchinList
                    title={'Habilitado para'}
                    placeHolder={'Seleccione donde quiere que aparezca'} 
                    disabled={disabled} 
                    action={setType}
                    list={[
                        {text:'Ventas',value:'sell'},
                        {text:'Compras',value:'purchase'},
                        {text:'Ambas',value:'both'}
                ]}/>
                <div className="FlexOption">
                    <h6>Es retención</h6>
                    <SwitchOption action={setIsRetention}/>
                </div>
                <FormButton 
                    text={'Crear nuevo impuesto'} 
                    disabled={disabled}
                    loading={loading}
                />
            </form>
        </div>
    )
}