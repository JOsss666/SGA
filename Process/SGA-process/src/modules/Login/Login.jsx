import { BoldTitle } from '../userApp/components/BoldTitle';
import './Login.css';
import React, { useState } from 'react';
import { postInfo } from '../../utils/functions';
import { FormButton } from '../userApp/components/FormButton';
import { FormInput } from '../userApp/components/FormInput';
import {ButtonAccounts} from './components/ButtonAccounts'
import { SwitchColorMode } from '../userApp/components/SwitchColorMode';
import { useNavigate } from 'react-router-dom';

export function Login() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [mail, setMail] = useState('');
    const [pass, setPass] = useState('');
    const [visiblePassword,setVisblePassword] = useState(false);
    const navigate = useNavigate();

    const handleRedirect = (info)=>{
        navigate(`/SGA_process/${info.company_key}/${info.user_key}/`)
    }

    const sendLogIn = async(event) => {
        event.preventDefault();
        setLoading(true);
        setError(null);
        const formInfo = { mail, pass };
        const res = await postInfo("/logIn", formInfo);
        if (Array.isArray(res) && res[0]) {
            handleRedirect(res[1][0])
        } else {
            setError("Contraseña o usuario incorrecta");
        }
        setLoading(false);
    };


    return (
        <div className="Login">
        <div className="Card">
            <div className="CardTitle">
            <BoldTitle text={'Iniciar Sesión'} />
            <h2>SGA - Procesos</h2>
            </div>
            <form className="Form" id="loginForm" autoComplete="off" onSubmit={(e) => {
                    e.preventDefault();
                    sendLogIn(e);
                }}>
                <div className="fields">
                    <FormInput title={"Email"} placeholder={"Correo@gmail.com"} type={"email"} value={mail} action={setMail}/>
                    <FormInput title={"Contraseña"} placeholder={"****"} type={visiblePassword? 'Text':"password"} value={pass} action={setPass} children={
                        <i className={`fa-regular fa-eye${visiblePassword? '-slash':''} setVisPass`} onClick={()=>{
                            setVisblePassword(!visiblePassword)
                        }}/>
                    }/>
                </div>
                <FormButton text={"Iniciar Sesión"} loading={loading}/>

                {error && <div className="error" role="alert">{error}</div>}

                <a href="#" className="forgot">Contraseña olvidada</a>
            </form>

            <div className="LoginAccounts">
                <ButtonAccounts icon={"fa-brands fa-google"} text={"Continuar con Google"}/>
                <ButtonAccounts icon={"fa-brands fa-apple"} text={"Continuar con Apple"}/>
            </div>
        </div>
        </div>
    );
}