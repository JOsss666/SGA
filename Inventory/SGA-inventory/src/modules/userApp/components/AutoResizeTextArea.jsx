import { useRef } from "react";
import './AutoResizeTextArea.css';

export function AutoResizeTextArea({ placeholder }) {
    const textA = useRef();

    const handleInput = () => {
        const el = textA.current;
        if (!el) return;

        el.style.height = 'auto';
        el.style.height = `${el.scrollHeight}px`;
    };

    return (
        <textarea
        ref={textA}
        onInput={handleInput}
        placeholder={placeholder}
        className="AutoResizeTextArea"
        style={{resize: 'none' }}
        />
    );
}
