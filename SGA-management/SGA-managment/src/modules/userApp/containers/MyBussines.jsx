import './MyBussines.css';
import { BoldTitle } from '../components/BoldTitle';
import { DescriptionSpan } from '../components/DescriptionSpan';
import { CardMyBussines } from '../components/CardMyBussines';
import {useAppInfo} from '../../../context/context'
import { useRef, useState } from 'react';

export function MyBussines(){
    const {appInfo} = useAppInfo();
    console.log(appInfo)
    const info= [
        {
            name: "Unidades de negoció",
            text: "Crea y administra todas las unidades de negocio, franquicias y tiendas que tengas disponibles.",
            image: 'https://res.cloudinary.com/djjxugmni/image/upload/v1763930815/3d-business-wallet-finance-illustration-free-png_vr9tvx.png'
        },{
            name: "Centros de costo",
            text: "Crea y administra todas las unidades de negocio, franquicias y tiendas que tengas disponibles.",
            image: 'https://res.cloudinary.com/djjxugmni/image/upload/v1763930815/3d-business-wallet-finance-illustration-free-png_vr9tvx.png'
        },{
            name: "Clientes y proveedores",
            text: "Crea y administra todas las unidades de negocio, franquicias y tiendas que tengas disponibles.",
            image: 'https://res.cloudinary.com/djjxugmni/image/upload/v1763930685/ChatGPT_Image_23_nov_2025_15_41_45_xvrjtd.png'
        },{
            name: "Personal",
            text: "Crea y administra todas las unidades de negocio, franquicias y tiendas que tengas disponibles.",
            image: 'https://res.cloudinary.com/djjxugmni/image/upload/v1764082062/ChatGPT_Image_25_nov_2025_09_47_22_lmd5sy.png'
        },
    ]
    
    const VISIBLE = 4;
    // datos reales (aquí los genero con el mismo info repetido para tu ejemplo)
    const cardsData = [
        { name: "Unidades de Negocio", text: "Crea y administra todas las unidades de negocio, franquicias y tiendas que tengas disponibles.", image:'https://res.cloudinary.com/djjxugmni/image/upload/v1763930815/3d-business-wallet-finance-illustration-free-png_vr9tvx.png'},
        { name: "Centros de costo", text: "Crea y administra todas las unidades de negocio, franquicias y tiendas que tengas disponibles.",image:'https://res.cloudinary.com/djjxugmni/image/upload/v1763930815/3d-business-wallet-finance-illustration-free-png_vr9tvx.png' },
        { name: "Clientes y Proveedores", text: "Crea y administra todas las unidades de negocio, franquicias y tiendas que tengas disponibles.", image:'https://res.cloudinary.com/djjxugmni/image/upload/v1763930685/ChatGPT_Image_23_nov_2025_15_41_45_xvrjtd.png'},
        { name: "Personal", text: "Crea y administra todas las unidades de negocio, franquicias y tiendas que tengas disponibles.", image:'https://res.cloudinary.com/djjxugmni/image/upload/v1764082062/ChatGPT_Image_25_nov_2025_09_47_22_lmd5sy.png' },
    ];


    const n = info.length;
    const trackRef = useRef(null);

    // índice dentro del array con clones (0 .. n + 2*VISIBLE - 1)
    // empezamos en VISIBLE (para mostrar la primera card real)
    const [index, setIndex] = useState(VISIBLE);
    const [isTransitionEnabled, setIsTransitionEnabled] = useState(true);

    // construimos el array con clones: [last-VISIBLE .. last] + originals + [first .. first+VISIBLE-1]
    const prefix = info.slice(-VISIBLE);
    const suffix = info.slice(0, VISIBLE);
    const all = [...prefix, ...info, ...suffix];

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
                                const isCenter = inViewport && (localPos === 1 || localPos === 2);

                                return (
                                <div
                                    key={`card-${i}`}
                                    className={`cardWrapper ${isCenter ? 'centerCard' : ''}`}
                                >
                                    <CardMyBussines info={cardInfo} />
                                </div>
                                );
                            })
                        }
                    </div>
                </div>

                <button className="carouselArrow right" onClick={handleNext} aria-label="Siguiente">
                    ›
                </button>
                {/*
                    <div className='carouselMyBussines'>
                        {info.map((element,index)=>(
                            <CardMyBussines info={element} key={index} />
                        ))}
                    </div>
                */}
            </div>
        </div>
    </div>
    )
}
