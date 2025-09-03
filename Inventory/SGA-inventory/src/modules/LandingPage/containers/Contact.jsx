

import { ConcatCard } from '../components/ConcatCard';
import { QuestionCard } from '../components/QuestionCard';
import { Titles } from '../components/Titles';
import './Contact.css';

export function Contact(){
    return(
        <div className="Contact">
            <div className="ContactContainer">
                <div className="ContactTitle">
                    <Titles text={'Contacta nuestro equipo'}/>
                </div>
                <div className="ContactContainerCard">
                    <ConcatCard icon={<i className="fa-regular fa-message icon"/>} title={'¿Cómo puedo crear una cuenta?'} description={'Para crear una cuenta, haz clic en el botón de registro en la esquina superior derecha y completa el formulario con tus datos.'} onClick={()=>window.location='tel:+1234567890'} children={'Comunicarme por este medio'}/>
                    <ConcatCard icon={<i className="fa-regular fa-message icon"/>} title={'¿Cómo puedo crear una cuenta?'} description={'Para crear una cuenta, haz clic en el botón de registro en la esquina superior derecha y completa el formulario con tus datos.'} onClick={()=>window.location='tel:+1234567890'} children={'Comunicarme por este medio'}/>
                    <ConcatCard icon={<i className="fa-regular fa-message icon"/>} title={'¿Cómo puedo crear una cuenta?'} description={'Para crear una cuenta, haz clic en el botón de registro en la esquina superior derecha y completa el formulario con tus datos.'} onClick={()=>window.location='tel:+1234567890'} children={'Comunicarme por este medio'}/>
                    <ConcatCard icon={<i className="fa-regular fa-message icon"/>} title={'¿Cómo puedo crear una cuenta?'} description={'Para crear una cuenta, haz clic en el botón de registro en la esquina superior derecha y completa el formulario con tus datos.'} onClick={()=>window.location='tel:+1234567890'} children={'Comunicarme por este medio'}/>
                    <ConcatCard icon={<i className="fa-regular fa-message icon"/>} title={'¿Cómo puedo crear una cuenta?'} description={'Para crear una cuenta, haz clic en el botón de registro en la esquina superior derecha y completa el formulario con tus datos.'} onClick={()=>window.location='tel:+1234567890'} children={'Comunicarme por este medio'}/>
                </div>
            </div>
            <div className="ContactQuestion">
                <div className="Subtitle">
                    <Titles text={'Preguntas Comunes'}/>
                </div>
                <div className="ContactQuestionCard">
                    <QuestionCard icon={<i className="fa-regular fa-file"/>} title={'Pregunta comun No. 1'} question={'Texto de respuesta a cada pregunta en forma de blog, se pueden dejar enlaces videos y demás material gráfico.'} children={'www.LinkDeRedirección.com'}/>
                    <QuestionCard icon={<i className="fa-regular fa-file"/>} title={'Pregunta comun No. 1'} question={'Texto de respuesta a cada pregunta en forma de blog, se pueden dejar enlaces videos y demás material gráfico.'} children={'www.LinkDeRedirección.com'}/>
                    <QuestionCard icon={<i className="fa-regular fa-file"/>} title={'Pregunta comun No. 1'} question={'Texto de respuesta a cada pregunta en forma de blog, se pueden dejar enlaces videos y demás material gráfico.'} children={'www.LinkDeRedirección.com'}/>
                </div>
            </div>
            <div className="ContactHelp">
                <div className="Subtitle">
                    <Titles text={'Preguntas Comunes'}/>
                </div>
            </div>
        </div>
    )
}