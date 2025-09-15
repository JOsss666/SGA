import { Titles } from '../components/Titles';
import './Login.css';
import React, { useState } from 'react';
import {postInfo} from '../../../utils/functions';
import { FormButton } from '../../GerenceApp/componets/FormButton';
import { FormInput } from '../../GerenceApp/componets/FormInput';
import { ButtonAccounts } from '../components/ButtonAccounts';

export function Login() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [mail, setMail] = useState('');
    const [pass, setPass] = useState('');


    const sendLogIn = async(event)=>{
        event.preventDefault();
        setLoading(true);
        setError(null);

        const formInfo = {
            mail,
            pass
        };

        const res = await postInfo("/login", formInfo);
        console.log(res);
        if(res[0]){
            alert(`Bienvenido ${res[1][0].user_name}`);
        }else{
            setError('Contraseña o usuario incorrecta');
        }
    }


    return (
        <div className="Login">
        <div className="Card">
            <div className="CardTitle">
            <Titles text={'Iniciar Sesión'} />
            <h2>Iniciar Sesión para SGA - Módulo</h2>
            </div>

            {/* el onSubmit maneja el POST */}
            <form className="Form" id="loginForm" autoComplete="off" onSubmit={sendLogIn}>
                <div className="fields">
                    <FormInput title={"Email"} placeholder={"Correo@gmail.com"} type={"email"} value={mail} onChange={(e) => setUserName(e.target.value)}/>
                    <FormInput title={"Contraseña"} placeholder={"****"} type={"password"} value={pass} onChange={(e) => setUserName(e.target.value)}/>
                </div>
                <FormButton text={"Iniciar Sesión"} loading={loading}/>

                {error && <div className="error" role="alert">{error}</div>}
                {/* Opcional: podrías mostrar un mensaje de éxito si lo prefieres */}
                {/* {success && <div className="success" role="status">{success}</div>} */}

                <a href="#" className="forgot">Contraseña olvidada</a>
            </form>

            <hr/>

            <div className="LoginAccounts">
                <ButtonAccounts icon={"fa-brands fa-google"} text={"Continuar con Google"}/>
                <ButtonAccounts icon={"fa-brands fa-apple"} text={"Continuar con Apple"}/>
            </div>

            <div className="singUp">
                <p>¿No tienes cuenta? <a href="#">Registrarme</a></p>
            </div>
        </div>
        </div>
    );
}