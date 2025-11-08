import { useEffect, useState } from "react";
import { FormInput } from "../../components/FormInput";
import { SearchinList } from "../../components/SearchInList";
import { FormButton } from "../../components/FormButton";
import { BoldTitle } from "../../components/BoldTitle";
import './FormNewTax.css';
import { NewElementSelect } from '../../components/NewElementSelect';
import { postInfo } from "../../../../utils/functions";
import { useAlert, useAppInfo, useNotifications } from "../../../../context/context";

export function FormNewTax({reloadInfo}){
    const {addNotification} = useNotifications();
    const {appInfo} = useAppInfo();
    const {popOutAlert} = useAlert();
    const [code, setCode] = useState('');
    const [rate, setRate] = useState('');
    const [selectedAccount, setSelectedAccount] = useState();
    const [disabled, setDisabled] = useState(false);
    const [base,setBase] = useState(0);
    const [loading, setLoading] = useState(false);
    const [accounts, setAccounts] = useState([]);

    const getAccounts = async () => {
        let res = await postInfo('/getAccountsPlan', {
            company_id:appInfo.company_id
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
        } else {
            setAccounts('Error');
        }
    }

    const formInfo = {
        company_id: appInfo.company_id,
        code: code,
        rate: parseFloat(rate),
        base,
        account_id: selectedAccount
    };
    
    const createTax = async () => {
        setDisabled(true);
        setLoading(true);
        let res = await postInfo('/createTax', formInfo);
        if(res){
            addNotification({
                type: 'aproved',
                title: 'Nuevo Impuesto creado',
                description: `El impuesto "${name}" ha sido creado correctamente.`
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
    }, []);

    return(
        <div className="FormNewTax">
            <BoldTitle text={'Nuevo Impuesto'}/>
            <form className="createNewTax" onSubmit={(e) => {
                e.preventDefault();
                createTax();
            }}>
                <FormInput 
                    action={setCode} 
                    title={'Código'} 
                    placeholder={'Código del impuesto'}
                />
                <FormInput 
                    action={setRate} 
                    title={'Tasa'} 
                    placeholder={'Tasa del impuesto'}
                    type="number"
                    step="0.01"
                />
                <FormInput 
                    action={setBase} 
                    title={'Base'} 
                    type={'number'}
                    placeholder={'A partir de '}
                />
                <SearchinList 
                    action={setSelectedAccount} 
                    title={'Cuenta'} 
                    list={accounts}
                    placeHolder={'Seleccionar Cuenta'}
                    specialOption={
                        <NewElementSelect title={'Crear nueva cuenta'}/>
                    }
                />
                <FormButton 
                    text={'Crear nuevo impuesto'} 
                    disabled={disabled}
                    loading={loading}
                />
            </form>
        </div>
    )
}