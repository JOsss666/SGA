import './MyBussines.css';
import { BoldTitle } from '../components/BoldTitle';
import { DescriptionSpan } from '../components/DescriptionSpan';
import { CardMyBussines } from '../components/CardMyBussines';
import React, { useRef, useState } from 'react';

export function MyBussines(){
    
    const info={
        name: "Nombre Empresa",
        text: "Crea y administra todas las unidades de negocio, franquicias y tiendas que tengas disponibles.",
        image: ""
    }
    
    const VISIBLE = 4;
    // datos reales (aquí los genero con el mismo info repetido para tu ejemplo)
    const cardsData = [
        { name: "Unidades de Negocio", text: "Crea y administra todas las unidades de negocio, franquicias y tiendas que tengas disponibles." },
        { name: "Centros de costo", text: "Crea y administra todas las unidades de negocio, franquicias y tiendas que tengas disponibles." },
        { name: "Clientes y Proveedores", text: "Crea y administra todas las unidades de negocio, franquicias y tiendas que tengas disponibles." },
        { name: "Personal", text: "Crea y administra todas las unidades de negocio, franquicias y tiendas que tengas disponibles." },
        { name: "Card 5", text: "Crea y administra todas las unidades de negocio, franquicias y tiendas que tengas disponibles." },
        { name: "Card 6", text: "Info 6" },
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
                <BoldTitle text={info.name}/>
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
            </div>
            
        </div>
    )
}
