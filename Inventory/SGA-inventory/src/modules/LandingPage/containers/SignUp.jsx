import { Titles } from '../components/Titles';
import './SignUp.css';
import React, { useState } from 'react';
import { postInfo } from '../../../utils/functions';
import { FormButton } from '../../GerenceApp/componets/FormButton';
import { FormInput } from '../../GerenceApp/componets/FormInput';

export function SignUp(){
    
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [user_name, setUserName] = useState('');
    const [mail, setMail] = useState('');
    const [pass, setPass] = useState('');


    const sendSignUp = async(event)=>{
        event.preventDefault();
        setLoading(true);
        setError(null);

        const formInfo = {
            user_name,
            mail,
            pass
        };

        const res = await postInfo("/SignUp", formInfo);
        console.log(res);
        if(res[0]){
            alert(`Registro exitoso`);
        }else{
            setError('Datos incorrectos');
        }
    }

    return (
        <div className="SignUp">
        <div className="Card">
            <div className="CardTitle">
            <Titles text={'Registro'} />
            </div>

            {/* el onSubmit maneja el POST */}
            <form className="Form" id="SignUpForm" autoComplete="off" onSubmit={sendSignUp}>
            <div className="fields">
                <FormInput title={"Nombre"} placeholder={"Tu nombre"} type={"text"} value={user_name} onChange={(e) => setUserName(e.target.value)}/>
                <FormInput title={"Email"} placeholder={"Correo@gmail.com"} type={"email"} value={mail} onChange={(e) => setUserName(e.target.value)}/>
                <FormInput title={"Contraseña"} placeholder={"****"} type={"password"} value={pass} onChange={(e) => setUserName(e.target.value)}/>
            </div>
            <FormButton text={"Registrar"} loading={loading}/>

            {error && <div className="error" role="alert">{error}</div>}
            {/* Opcional: podrías mostrar un mensaje de éxito si lo prefieres */}
            {/* {success && <div className="success" role="status">{success}</div>} */}

            </form>
        </div>
        </div>
    );
}