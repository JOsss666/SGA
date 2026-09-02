import { useEffect, useRef, useState } from 'react';
import './AgentsSelector.css';

const normalizeOptionText = value => value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLocaleLowerCase('es');

const filterAgentOptions = (options, query = '') => {
    const normalizedQuery = normalizeOptionText(query.trim());
    return options.filter(option => normalizeOptionText(option.text).includes(normalizedQuery));
};

export function AgentsSelector({
    options = [],
    value,
    onChange,
    onSelect,
    disabled = false,
    popup = false,
    query = ''
}) {
    const [visible, setVisible] = useState(false);
    const selectorRef = useRef();
    const optionRefs = useRef([]);
    const selectedOption = options.find(option => option.value === value) || options[0];
    const filteredOptions = filterAgentOptions(options, query);
    const showOptions = popup || visible;

    useEffect(() => {
        if (!visible || popup) return undefined;

        const closeOnOutsideClick = event => {
            if (!selectorRef.current?.contains(event.target)) setVisible(false);
        };
        const closeOnEscape = event => {
            if (event.key === 'Escape') setVisible(false);
        };

        document.addEventListener('pointerdown', closeOnOutsideClick);
        window.addEventListener('keydown', closeOnEscape);
        return () => {
            document.removeEventListener('pointerdown', closeOnOutsideClick);
            window.removeEventListener('keydown', closeOnEscape);
        };
    }, [popup, visible]);

    const selectAgent = option => {
        onChange?.(option.value);
        onSelect?.(option);
        setVisible(false);
    };

    const handleTriggerKeyDown = event => {
        if (event.key !== 'ArrowDown' || filteredOptions.length === 0) return;
        event.preventDefault();
        setVisible(true);
        requestAnimationFrame(() => optionRefs.current[0]?.focus());
    };

    const handleOptionKeyDown = (event, index) => {
        if (!['ArrowDown', 'ArrowUp'].includes(event.key)) return;
        event.preventDefault();
        const direction = event.key === 'ArrowDown' ? 1 : -1;
        const nextIndex = (index + direction + filteredOptions.length) % filteredOptions.length;
        optionRefs.current[nextIndex]?.focus();
    };

    return (
        <div className={`AgentsSelector ${popup ? 'agentsSelectorPopup' : ''}`} ref={selectorRef}>
            {!popup && <button
                type="button"
                className="agentsSelectorTrigger"
                disabled={disabled || !selectedOption}
                aria-haspopup="listbox"
                aria-expanded={visible}
                onClick={() => setVisible(previous => !previous)}
                onKeyDown={handleTriggerKeyDown}
            >
                <i className="bi bi-sliders" aria-hidden="true"/>
                {selectedOption && (
                    <>
                        <span>{selectedOption.text}</span>
                        <span className="agentsSelectorIcon">{selectedOption.children}</span>
                    </>
                )}
            </button>}
            {showOptions && (
                <div className="agentsSelectorList" role="listbox" aria-label="Agente de IA">
                    {filteredOptions.map((option, index) => (
                        <button
                            type="button"
                            role="option"
                            aria-selected={option.value === selectedOption?.value}
                            className={option.value === selectedOption?.value ? 'agentsSelectorOptionSelected' : ''}
                            key={option.value}
                            ref={node => { optionRefs.current[index] = node; }}
                            onClick={() => selectAgent(option)}
                            onKeyDown={event => handleOptionKeyDown(event, index)}
                        >
                            <span className="agentsSelectorIcon">{option.children}</span>
                            <span>{option.text}</span>
                            {option.value === selectedOption?.value && (
                                <i className="fa-solid fa-check" aria-hidden="true"/>
                            )}
                        </button>
                    ))}
                    {filteredOptions.length === 0 && (
                        <span className="agentsSelectorEmpty" role="status">
                            No encontramos agentes para “{query}”.
                        </span>
                    )}
                </div>
            )}
        </div>
    );
}

AgentsSelector.filterOptions = filterAgentOptions;
