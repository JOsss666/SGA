import { useEffect, useRef, useState } from 'react';
import { useAiAssistant } from '../../../context/context';
import './AiPet.css';

const BLINK_DELAY = 5000;
const BLINK_DURATION = 180;
const LONG_PRESS_DELAY = 500;
const PET_DURATION = 1000;
const SUCCESS_FRAME_DURATION = 2000;

const petFrames = {
    inactive:'https://cdnmain.sga360.co/static/pets/inventoryPet/1.png',
    inactiveEyeSlash:'https://cdnmain.sga360.co/static/pets/inventoryPet/2.png',
    thinking:'https://cdnmain.sga360.co/static/pets/inventoryPet/3.png',
    working:'https://cdnmain.sga360.co/static/pets/inventoryPet/4.png',
    success:'https://cdnmain.sga360.co/static/pets/inventoryPet/5.png',
    pet:'https://cdnmain.sga360.co/static/pets/inventoryPet/acariciar.png'
};

const formatProcess = (process) => process
    ?.replaceAll('-', ' ')
    .replaceAll('_', ' ')
    .replace(/^./, character => character.toUpperCase());

export function AiPet(){
    const {
        active,
        loading,
        task,
        process,
        completed,
        success,
        error,
        setVisibleChatAi
    } = useAiAssistant();

    const [interactionFrame,setInteractionFrame] = useState(null);
    const [isPetting,setIsPetting] = useState(false);
    const [showSuccessFrame,setShowSuccessFrame] = useState(false);
    const [hidden,setHidden] = useState(false);
    const longPressTimerRef = useRef();
    const petTimerRef = useRef();

    const isBusy = active || loading;
    const isAgentThinking = process === 'general-assistant' || process === 'processAiRequest';
    const baseFrame = isBusy
        ? (isAgentThinking ? 'thinking' : 'working')
        : (showSuccessFrame && success ? 'success' : 'inactive');
    const frame = isPetting ? 'pet' : (interactionFrame ?? baseFrame);

    const taskLabel = isBusy
        ? (task || 'Procesando solicitud')
        : (completed ? (task || 'Última tarea de IA') : 'Asistente disponible');

    const statusLabel = isBusy
        ? (isAgentThinking ? 'Pensando' : `Ejecutando ${formatProcess(process) || 'proceso'}`)
        : (completed
            ? (success ? 'Tarea completada' : 'La tarea no pudo completarse')
            : 'En espera');

    useEffect(() => {
        if (!completed || !success) {
            setShowSuccessFrame(false);
            return undefined;
        }

        setShowSuccessFrame(true);
        const successTimer = window.setTimeout(
            () => setShowSuccessFrame(false),
            SUCCESS_FRAME_DURATION
        );
        return () => window.clearTimeout(successTimer);
    }, [completed, success, task]);

    useEffect(() => {
        if (baseFrame !== 'inactive' || isPetting || hidden) {
            setInteractionFrame(null);
            return undefined;
        }

        let blinkTimer;
        let blinkEndTimer;
        const scheduleBlink = () => {
            blinkTimer = window.setTimeout(() => {
                setInteractionFrame('inactiveEyeSlash');
                blinkEndTimer = window.setTimeout(() => {
                    setInteractionFrame(null);
                    scheduleBlink();
                }, BLINK_DURATION);
            }, BLINK_DELAY);
        };

        scheduleBlink();
        return () => {
            window.clearTimeout(blinkTimer);
            window.clearTimeout(blinkEndTimer);
        };
    }, [baseFrame, hidden, isPetting]);

    useEffect(() => () => {
        window.clearTimeout(longPressTimerRef.current);
        window.clearTimeout(petTimerRef.current);
    }, []);

    const beginLongPress = () => {
        window.clearTimeout(longPressTimerRef.current);
        longPressTimerRef.current = window.setTimeout(() => {
            setIsPetting(true);
            window.clearTimeout(petTimerRef.current);
            petTimerRef.current = window.setTimeout(() => {
                setIsPetting(false);
            }, PET_DURATION);
        }, LONG_PRESS_DELAY);
    };

    const cancelLongPress = () => {
        window.clearTimeout(longPressTimerRef.current);
    };

    const handlePointerDown = (event) => {
        if (event.button !== 0) return;
        event.currentTarget.setPointerCapture?.(event.pointerId);
        beginLongPress();
    };

    const handleKeyDown = (event) => {
        if ((event.key !== 'Enter' && event.key !== ' ') || event.repeat) return;
        event.preventDefault();
        beginLongPress();
    };

    const handleKeyUp = (event) => {
        if (event.key !== 'Enter' && event.key !== ' ') return;
        cancelLongPress();
    };

    if (hidden) {
        return (
            <div className="AiPet AiPetHidden">
                <button
                    className="showPetButton"
                    type="button"
                    aria-label="Mostrar mascota de IA"
                    title="Mostrar mascota de IA"
                    onClick={() => setHidden(false)}
                >
                    <img src={petFrames.inactive} alt="" aria-hidden="true"/>
                    <i className="fa-solid fa-angle-up" aria-hidden="true"/>
                </button>
            </div>
        );
    }

    return(
        <section className={`AiPet AiPet-${frame}`} aria-label="Actividad del asistente de IA">
            <div className="actualTaskContainer" role="status" aria-live="polite" aria-atomic="true">
                <strong title={taskLabel}>{taskLabel}</strong>
                <span title={error || statusLabel}>{statusLabel}</span>
            </div>
            <div className="petContainer">
                <button
                    className="petInteraction"
                    type="button"
                    aria-label="Mantén presionado para acariciar la mascota de IA"
                    aria-pressed={isPetting}
                    title="Mantén presionado para acariciar"
                    onPointerDown={handlePointerDown}
                    onPointerUp={cancelLongPress}
                    onPointerCancel={cancelLongPress}
                    onLostPointerCapture={cancelLongPress}
                    onKeyDown={handleKeyDown}
                    onKeyUp={handleKeyUp}
                    onContextMenu={event => event.preventDefault()}
                >
                    <img key={frame} src={petFrames[frame]} alt="" aria-hidden="true" draggable="false"/>
                </button>
            </div>
            <div className="optionsPet">
                <button
                    type="button"
                    title="Abrir asistente de IA"
                    aria-label="Abrir asistente de IA"
                    onClick={() => setVisibleChatAi(true)}
                >
                    <i className="bi bi-soundwave" aria-hidden="true"/>
                </button>
                <button
                    type="button"
                    title="Ocultar mascota"
                    aria-label="Ocultar mascota de IA"
                    onClick={() => setHidden(true)}
                >
                    <i className="fa-solid fa-angle-down" aria-hidden="true"/>
                </button>
            </div>
        </section>
    );
}
