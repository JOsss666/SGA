import { Titles } from '../components/Titles';
import './Login.css';
import React, { useState } from 'react';
import { postInfo } from '../../../../../../SGA/Inventory/SGA-inventory/src/utils/functions';

export function Login() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault(); // evita recargar la página

        // Limpiar errores previos
        setError(null);

        const formData = new FormData(e.target);
        const formInfo = {
            mail: formData.get("email"),   // nombre igual al backend
            pass: formData.get("password")
        };

        try {
        setLoading(true);

        // Llamada al backend con el helper
        // Asegúrate de que postInfo acepte la ruta base adecuada
        // y que maneje CORS si es necesario.
        const res = await postInfo("/login", formInfo);
        console.log("Respuesta del backend:", res);

        // Supongamos que el backend devuelve un arreglo con usuarios coincidentes
        if (Array.isArray(res) && res.length > 0) {
            alert(`Bienvenido ${res[0].user_name || formInfo.mail}`);
            // 👉 aquí podrías guardar sesión en localStorage o redirigir
            // localStorage.setItem("user", JSON.stringify(res[0]));
            // window.location.href = "/dashboard";
        } else {
            // Si no hay coincidencias, credenciales incorrectas
            setError("Credenciales incorrectas");
        }
        } catch (err) {
        console.error("Error en login:", err);
        setError("Error al iniciar sesión");
        } finally {
        setLoading(false);
        }
    };

    return (
        <div className="Login">
        <div className="Card">
            <div className="CardTitle">
            <Titles text={'Iniciar Sesión'} />
            <h2>Iniciar Sesión para SGA - Módulo</h2>
            </div>

            {/* 👇 el onSubmit maneja el POST */}
            <form className="Form" id="loginForm" autoComplete="off" onSubmit={handleSubmit}>
            <div className="fields">
                <label htmlFor="email">Email</label>
                <input
                type="email"
                id="email"
                name="email"
                placeholder="Correo@gmail.com"
                required
                />

                <label htmlFor="password">Contraseña</label>
                <input
                type="password"
                id="password"
                name="password"
                required
                />
            </div>
            
            <button type="submit" className="btn" disabled={loading}>
                {loading ? 'Iniciando...' : 'Inicia sesión'}
            </button>

            {error && <div className="error" role="alert">{error}</div>}
            {/* Opcional: podrías mostrar un mensaje de éxito si lo prefieres */}
            {/* {success && <div className="success" role="status">{success}</div>} */}

            <a href="#" className="forgot">Contraseña olvidada</a>
            </form>

            <hr/>

            <div className="LoginAccounts">
            <button className="btn btnAccounts" id="googleBtn" onClick={() => alert('Funcionalidad pendiente')}>
                <i className="fa-brands fa-google btnIcon"/>
                <p className='btnText'>Continuar con Google</p>
            </button>
            <button className="btn btnAccounts" id="appleBtn" onClick={() => alert('Funcionalidad pendiente')}>
                <i className="fa-brands fa-apple btnIcon"/>
                <p className='btnText'>Continuar con Apple</p>
            </button>
            </div>

            <div className="singUp">
            <p>¿No tienes cuenta? <a href="#">Registrarme</a></p>
            </div>
        </div>
        </div>
    );
}