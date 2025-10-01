

import { ContactCard } from '../components/ContactCard';
import { QuestionCard } from '../components/QuestionCard';
import { Titles } from '../components/Titles';
import './Contact.css';

export function Contact(){
    return(
        <div className="Contact">
            <div className="ContactContainer">
                <div className="ContactTitle">
                    <Titles text={'Contacta nuestro equipo'}/>
                    <h2>Si tienes alguna duda aquí para ayudarte</h2>
                </div>
                <div className="ContactContainerCard">
                    <ContactCard icon={<i className="fa-regular fa-message Icon"/>} title={'Chat Soporte Técnico'} description={'Atención L-V 6AM - 10PM'}  children={'Comunicarme por este medio'}/>
                    <ContactCard icon={<i className="fa-regular fa-message Icon"/>} title={'Chat Soporte Técnico'} description={'Atención L-V 6AM - 10PM'}  children={'Comunicarme por este medio'}/>
                    <ContactCard icon={<i className="fa-regular fa-message Icon"/>} title={'Chat Soporte Técnico'} description={'Atención L-V 6AM - 10PM'}  children={'Comunicarme por este medio'}/>
                    <ContactCard icon={<i className="fa-regular fa-message Icon"/>} title={'Asistente AI'} description={'Atención 24/7'}  children={'Comunicarme por este medio'}/>
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