import { useState } from "react";
import { BoldTitle } from "../../components/BoldTitle";
import { useAppInfo } from "../../../../context/context";
import { FormInput } from "../../components/FormInput";



export function FormNewAccount({update, updateInfo = {}}){

    console.log(updateInfo)

    // Requirements
    const {appInfo} = useAppInfo();

    // Control
    const [loading,setLoading] = useState(false);
    const [disabled,setDisabled] = useState(false);

    // FormVariables
    const [code,setCode] = useState(updateInfo.code??'');
    const [name,setName] = useState(updateInfo.name??'');
    const [type,setType] = useState(updateInfo.type??'');
    const [state,setState] = useState(updateInfo.status??'active');
    const [type_account,setTypeAccount] = useState(updateInfo.status??'');

    const formInfo = {
        company_id:appInfo.company_id,
        code,
        name,
        type,
        state,
        type_account
    }

    return(
        <div className="FormNewAccount">
            <BoldTitle text={update? 'Nueva cuenta contble':`Actualizar ${updateInfo.name}`}/>
            <form action="">
                <FormInput type={'text'} action={setCode} disabled={disabled} value={code}/>
            </form>
        </div>
    )
}