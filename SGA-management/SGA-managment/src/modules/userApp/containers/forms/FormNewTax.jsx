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
    const [name, setName] = useState('');
    const [code, setCode] = useState('');
    const [rate, setRate] = useState('');
    const [selectedAccount, setSelectedAccount] = useState();
    const [disabled, setDisabled] = useState(false);
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
        name: name,
        code: code,
        rate: parseFloat(rate),
        account_id: selectedAccount
    };


    return(
        <div className="FormNewTax">
            <BoldTitle text={'Nuevo Impuesto'}/>
            <form className="createNewTax" onSubmit={(e) => {
                e.preventDefault();
                createTax();
            }}>
                <FormInput 
                    action={setName} 
                    title={'Nombre'} 
                    placeholder={'Nombre del nuevo impuesto'}
                />
                <FormInput 
                    action={setCode} 
                    title={'Código'} 
                    placeholder={'Código del impuesto'}
                />
                <FormInput 
                    action={setRate} 
                    title={'Tasa'} 
                    placeholder={'Tasa del impuesto (ej: 0.12)'}
                    type="number"
                    step="0.01"
                />
                <SearchinList 
                    action={setSelectedAccount} 
                    title={'Cuenta'} 
                    list= {[]} 
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