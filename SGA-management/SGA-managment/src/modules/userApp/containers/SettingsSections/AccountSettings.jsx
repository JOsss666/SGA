import { useState } from "react";
import { useAppInfo } from "../../../../context/context"
import { FormInput } from "../../components/FormInput";
import './AccountSettings.css'
import { LabelValue } from "../../components/LabelValue";
import { ButtonMenu } from "../../components/ButtonMenu";
import { FormButton } from "../../components/FormButton";

export function AccountSettings(){

    const {userInfo,appInfo} = useAppInfo();
    const [disabled,setDisabled] = useState(false);

    console.log(userInfo,appInfo)

    return(
        <div className="AccountSettings">
            <section>
                <h3 className="sectionSettingsTitle">Información Personal</h3>
                <div className="gridOptions">
                    <LabelValue title={'Compañia'} value={<h6>{appInfo.legal_name}</h6>}/>
                    <FormInput title={'Nombre'} value={userInfo.user_name} placeholder={'tu nombre de usuario'} />
                    <FormInput title={'Correo electrónico'} value={userInfo.user_mail} placeholder={'tu correo asociado'} />
                    <LabelValue title={'Contraseña'} value={<h6>************** <ButtonMenu title={'Editar contraseña'} noRotate={true} children={
                        <i className="fa-solid fa-pencil"/>
                    }/></h6>}/>
                    <FormButton text={'Guardar cambios'}/>
                </div>
            </section>
        </div>
    )
}