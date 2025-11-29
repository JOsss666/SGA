import './MyBussines.css';
import { BoldTitle } from '../components/BoldTitle';
import { DescriptionSpan } from '../components/DescriptionSpan';
import { CardMyBussines } from '../components/CardMyBussines';
import {useAlert, useAppInfo} from '../../../context/context'
import { useRef, useState } from 'react';
import { FormNewCostCenter } from './forms/FormNewCostCenter';
import { useNavigate, useParams } from 'react-router-dom';
import { FormNewThirdParties } from './forms/FormNewThirdParties';
import { FormNewUser } from './forms/FormNewUser';
import { FormNewStore } from './forms/FormNewStore';

export function MyBussines(){
    const {appInfo} = useAppInfo();
    const navigate = useNavigate();
    const params = useParams();
    const {popInAlert} = useAlert();

    const handleNavigate = (path)=>{
        navigate(`SGA_management/${params.company_key}/${params.user_key}/myBussines/${path}`)
    }

    const VISIBLE = 4;
    const cardsData = [
        { name: "Unidades de Negocio", text: "Crea y administra todas las unidades de negocio, franquicias y tiendas que tengas disponibles.", image:'https://res.cloudinary.com/djjxugmni/image/upload/v1763930815/3d-business-wallet-finance-illustration-free-png_vr9tvx.png',form:<FormNewStore/>},
        { name: "Centros de costo", text: "Crea y administra todas las unidades de negocio, franquicias y tiendas que tengas disponibles.",image:'https://res.cloudinary.com/djjxugmni/image/upload/v1763930815/3d-business-wallet-finance-illustration-free-png_vr9tvx.png',form:<FormNewCostCenter/>,path:'costCenters'},
        { name: "Clientes y Proveedores", text: "Crea y administra todas las unidades de negocio, franquicias y tiendas que tengas disponibles.", image:'https://res.cloudinary.com/djjxugmni/image/upload/v1763930685/ChatGPT_Image_23_nov_2025_15_41_45_xvrjtd.png', form:<FormNewThirdParties/>,path:'thirdParties'},
        { name: "Listas de precios", text: "Crea y administra todas las unidades de negocio, franquicias y tiendas que tengas disponibles.", image:'https://res.cloudinary.com/djjxugmni/image/upload/v1764363272/ChatGPT_Image_28_nov_2025_15_54_16_tl5bv3.png',form:<FormNewUser/>},
        { name: "Personal", text: "Crea y administra todas las unidades de negocio, franquicias y tiendas que tengas disponibles.", image:'https://res.cloudinary.com/djjxugmni/image/upload/v1764082062/ChatGPT_Image_25_nov_2025_09_47_22_lmd5sy.png',form:<FormNewUser/>}
    ];


    const n = cardsData.length;
    const trackRef = useRef(null);

    // índice dentro del array con clones (0 .. n + 2*VISIBLE - 1)
    // empezamos en VISIBLE (para mostrar la primera card real)
    const [index, setIndex] = useState(VISIBLE);
    const [isTransitionEnabled, setIsTransitionEnabled] = useState(true);

    // construimos el array con clones: [last-VISIBLE .. last] + originals + [first .. first+VISIBLE-1]
    const prefix = cardsData.slice(-VISIBLE);
    const suffix = cardsData.slice(0, VISIBLE);
    const all = [...prefix, ...cardsData, ...suffix];

    // cuando cambie index por wrap, ajustamos sin animación (jump)
    const handleTransitionEnd = () => {
        if (index === 0) {
            setIsTransitionEnabled(false);
            setIndex(n);
            requestAnimationFrame(() => {
                requestAnimationFrame(() => setIsTransitionEnabled(true));
            });
            return;
        }
        if (index === n + VISIBLE) {
            setIsTransitionEnabled(false);
            setIndex(VISIBLE);
            requestAnimationFrame(() => {
                requestAnimationFrame(() => setIsTransitionEnabled(true));
            });
            return;
        }
    };

    const handlePrev = () => {
        setIndex(prev => prev - 1);
    };
    const handleNext = () => {
        setIndex(prev => prev + 1);
    };

    // porcentaje a desplazar: cada card ocupa 100 / VISIBLE % del viewport
    const shiftPercent = (100 / VISIBLE) * index;

    return(
        <div className="MyBussines">
            <div className="headMyBussines">
                <DescriptionSpan text={'¿Que hay de nuevo?'}/>
                <BoldTitle text={appInfo.legal_name}/>
            </div>


            <div className="carouselWrapper">
                <button className="carouselArrow left" onClick={handlePrev} aria-label="Anterior">
                    ‹
                </button>

                <div className="carouselViewport">
                    <div
                        className={`carouselTrack ${isTransitionEnabled ? 'withTransition' : 'noTransition'}`}
                        ref={trackRef}
                        onTransitionEnd={handleTransitionEnd}
                        style={{ transform: `translateX(-${shiftPercent}%)` }}
                    >
                        {
                            /* Renderizamos todas las cards (clones incluidos) manteniendo la estructura.
                            Envolvemos cada Card en .cardWrapper para poder escalarlas cuando estén en el centro */
                            all.map((cardInfo, i) => {
                                // determinar si la posición i está dentro de la ventana visible [index, index+VISIBLE)
                                const inViewport = (i >= index) && (i < index + VISIBLE);
                                // posición local dentro de la vista (0..VISIBLE-1) si está visible
                                const localPos = inViewport ? (i - index) : null;
                                // las dos del centro en 4 visibles son las posiciones 1 y 2
                                const isCenter = inViewport && (localPos === 1);

                                return (
                                <div
                                    key={`card-${i}`}
                                    className={`cardWrapper ${isCenter ? 'centerCard' : ''}`}
                                >
                                    <CardMyBussines info={cardInfo} onClick={()=>{
                                        if(cardInfo.form != undefined){
                                            popInAlert(cardInfo.form)
                                        }
                                    }}/>
                                </div>
                                );
                            })
                        }
                    </div>
                </div>

                <button className="carouselArrow right" onClick={handleNext} aria-label="Siguiente">
                    ›
                </button>

        </div>
    </div>
    )
}
