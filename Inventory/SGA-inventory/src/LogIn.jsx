
import { BoldTitle } from './modules/GerenceApp/componets/BoldTitle';
import './LogIn.css';
import React, { useState } from 'react';
import { postInfo } from './utils/functions';
import { FormButton } from './modules/GerenceApp/componets/FormButton';
import { FormInput } from './modules/GerenceApp/componets/FormInput';
import { ButtonAccounts } from './modules/LandingPage/components/ButtonAccounts';
import { useNavigate } from 'react-router-dom';

export function LogIn() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [mail, setMail] = useState('');
    const [pass, setPass] = useState('');
    const navigate = useNavigate();

    const handleRedirect = (info)=>{
        navigate(`/SGA_INVENTORY/${info.company_key}/${info.user_key}/`)
    }

    const sendLogIn = async(event) => {
        event.preventDefault();
        setLoading(true);
        setError(null);
        const formInfo = { mail, pass };
        const res = await postInfo("/LogIn", formInfo);
        if (Array.isArray(res) && res[0]) {
            handleRedirect(res[1][0])
        } else {
            setError("Contraseña o usuario incorrecta");
        }
        setLoading(false);
    };


    return (
        <div className="LogIn">
        <div className="Card">
            <div className="CardTitle">
            <BoldTitle text={'Iniciar Sesión'} />
            <h2>SGA - Inventarios</h2>
            </div>
            <form className="Form" id="LogInForm" autoComplete="off" onSubmit={(e) => {
                    e.preventDefault();
                    sendLogIn(e);
                }}>
                <div className="fields">
                    <FormInput title={"Email"} placeholder={"Correo@gmail.com"} type={"email"} value={mail} action={setMail}/>
                    <FormInput title={"Contraseña"} placeholder={"****"} type={"password"} value={pass} action={setPass}/>
                </div>
                <FormButton text={"Iniciar Sesión"} loading={loading}/>

                {error && <div className="error" role="alert">{error}</div>}

                <a href="#" className="forgot">Contraseña olvidada</a>
            </form>

            <div className="LogInAccounts">
                <ButtonAccounts icon={"fa-brands fa-google"} text={"Continuar con Google"}/>
                <ButtonAccounts icon={"fa-brands fa-apple"} text={"Continuar con Apple"}/>
            </div>
        </div>
        </div>
    );
}