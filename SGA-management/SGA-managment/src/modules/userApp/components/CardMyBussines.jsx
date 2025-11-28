
import { BoldTitle } from './BoldTitle';
import './CardMyBussines.css';
import { DescriptionSpan } from './DescriptionSpan';
import { FormButton } from './FormButton';
import imageMyBussines from '../../../assets/imageCardMyBussines.png';
import { Route, Routes } from 'react-router-dom';
import { MyBussinesUnits } from '../containers/MyBussinesUnits';
import { useNavigate } from 'react-router-dom';

export function CardMyBussines({info, onClick}) {

    const navigate = useNavigate();
    const handleNavigate = ()=>{
        navigate(`${location.pathname}/Units`);
    }


    return (
        <div className="CardMyBussines" onClick={onClick}>
            <div className="imageCardMyBussines">
                <img src={info.image} alt="" />
            </div>

            <div className="infoCardMyBussines">
                <BoldTitle text={info.name} />
                <DescriptionSpan text={info.text} />
            </div>

            <div className="buttonCardMyBussines">        
                <FormButton text={"Crear Nueva"} onClick={() => handleNavigate(`Units`)}/>
            </div>
            <div className="linkCardMyBussines">
                <FormButton onClick={()=>{
                    {/*popInAlert(<"Componente para  Formulario"/>)*/}
                }} text={"Ver todos >"}/>
            </div>
        </div>
    );
}