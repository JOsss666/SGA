import { BoldTitle } from '../userApp/components/BoldTitle';
import './Login.css';
import React, { useState } from 'react';
import { urlSer } from '../../App';
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
        console.log(info)
        console.log(`/SGA_management/${info.company_key}/${(info.user_key)}/`)
        navigate(`/SGA_management/${info.company_key}/${(info.user_key)}/`)
    }

    const sendLogIn = async(event) => {
        event.preventDefault();
        setLoading(true);
        setError(null);
        try {
            // El backend local emite una cookie HttpOnly que protege los informes
            // contables; credentials permite que el navegador la guarde.
            const response = await fetch(`${urlSer}/logIn`, {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ mail, pass })
            });
            const res = await response.json();
            if (response.ok && Array.isArray(res) && res[0]) {
                handleRedirect(res[1][0]);
            } else {
                setError(res?.error?.message || "Contraseña o usuario incorrecta");
            }
        } catch {
            setError('No fue posible conectar con el servidor local.');
        } finally {
            setLoading(false);
        }
    };


    return (
        <div className="Login">
        <div className="Card">
            <div className="CardTitle">
            <BoldTitle text={'Iniciar Sesión'} />
            <h2>SGA - Administrativo</h2>
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
