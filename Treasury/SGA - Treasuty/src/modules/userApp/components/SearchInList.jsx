import { useEffect, useRef, useState } from 'react'
import './SearchInList.css'

export function SearchinList({
    title,
    placeHolder,
    list = [],
    disabled,
    action,
    children,
    specialOption,
    noActVal,
    canClear,
    defaultValue = {},
    value
}){
    
    const [searchValue, setSearchValue] = useState('');
    const [inputValue, setInputValue] = useState(defaultValue.text ?? '');
    const [selectedOption, setSelectedOption] = useState(defaultValue.value);
    const [visibleList, setVisibleList] = useState(false);
    const [focusedIndex, setFocusedIndex] = useState(-1);
    
    const listE = useRef(); // Referencia al contenedor <ul>

    const filteredList = list.filter(element => 
        !searchValue || element.text.toLowerCase().includes(searchValue.toLowerCase())
    );

    // --- LÓGICA DE SCROLL AUTOMÁTICO ---
    useEffect(() => {
        if (focusedIndex >= 0 && listE.current) {
            const listContainer = listE.current;
            const focusedElement = listContainer.children[focusedIndex + (specialOption ? 1 : 0)];

            if (focusedElement) {
                const containerTop = listContainer.scrollTop;
                const containerBottom = containerTop + listContainer.offsetHeight;
                const elementTop = focusedElement.offsetTop;
                const elementBottom = elementTop + focusedElement.offsetHeight;

                // Si el elemento está por debajo del scroll visible
                if (elementBottom > containerBottom) {
                    listContainer.scrollTop = elementBottom - listContainer.offsetHeight;
                } 
                // Si el elemento está por encima del scroll visible
                else if (elementTop < containerTop) {
                    listContainer.scrollTop = elementTop;
                }
            }
        }
    }, [focusedIndex, visibleList, specialOption]);
    // ----------------------------------

    const handleSelect = (element) => {
        const optionValue = element.value !== undefined ? element.value : element.text;

        if(!noActVal){
            setInputValue(element.text);
            setSearchValue('');
            setSelectedOption(optionValue);
        }

        if(action) action(optionValue);
        setVisibleList(false);
        setFocusedIndex(-1);
    };

    const clearSelection = () => {
        setFocusedIndex(-1);
        setVisibleList(false);
        setSearchValue('');
        setInputValue('');
        setSelectedOption('');
        if(action && !noActVal) action('');
    };

    const handleKeyDown = (e) => {
        if (!visibleList) return;

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setFocusedIndex(prev => (prev < filteredList.length - 1 ? prev + 1 : prev));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setFocusedIndex(prev => (prev > 0 ? prev - 1 : prev));
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (focusedIndex >= 0) handleSelect(filteredList[focusedIndex]);
            if(focusedIndex <= 0) setVisibleList(true);
            setVisibleList(false);
        } else if (e.key === 'Escape') {
            setVisibleList(false);
        }
    };

    useEffect(()=>{
        if(noActVal) return;

        const isControlled = value !== undefined;
        const selectedValue = isControlled
            ? value
            : selectedOption ?? defaultValue.value;
        if(selectedValue === undefined || selectedValue === null || selectedValue === ''){
            setInputValue('');
            return;
        }

        const comparableValue = currentValue => {
            if(currentValue && typeof currentValue === 'object'){
                return currentValue.id
                    ?? currentValue.thirdParty_id
                    ?? currentValue.product_id
                    ?? currentValue.value;
            }
            return currentValue;
        };

        const selectedElement = list.find(element => {
            const optionValue = element.value !== undefined ? element.value : element.text;
            return String(comparableValue(optionValue)) === String(comparableValue(selectedValue));
        });

        setInputValue(selectedElement?.text ?? defaultValue.text ?? '');
    }, [value, selectedOption, defaultValue.value, defaultValue.text, list, noActVal]);

    return(
        <div className="FacturationSearchinList" onClick={()=>{
            setVisibleList(true)
        }} onBlur={(e) => {
            if (!e.currentTarget.contains(e.relatedTarget)) {
                setVisibleList(false);
            }
        }}>  
            {title && <label>{title}</label>}
            <div className="SlistC">
                <input 
                    type="text"
                    value={inputValue}
                    placeholder={disabled ? "Sin opciones disponibles" : placeHolder} 
                    disabled={disabled} 
                    onFocus={() => setVisibleList(true)}
                    onKeyDown={handleKeyDown}
                    onChange={(e) => {
                        setInputValue(e.target.value);
                        setSearchValue(e.target.value);
                        setFocusedIndex(-1);
                    }}
                />
                {canClear && (
                    <i 
                        className="fa-solid fa-xmark clearSelectedOptionBtn"
                        onClick={(e)=>{
                            e.stopPropagation(); // 🔥 CLAVE
                            clearSelection();
                        }}
                    />
                )}
                {visibleList && (
                    <ul ref={listE} className="listElementsContainer">
                        <div onMouseDown={(e)=>{
                            e.preventDefault();
                        }}>
                            {specialOption}
                        </div>
                        {filteredList.map((element, index) => (
                            <li 
                                className={focusedIndex === index ? 'focused-item' : ''}
                                onMouseDown={(e) => {
                                    e.preventDefault(); // Evita que el input pierda el foco inmediatamente
                                    handleSelect(element);
                                }}
                                key={index}
                                // Opcional: sincronizar el foco del mouse con el teclado
                                onMouseEnter={() => setFocusedIndex(index)}
                            >
                                {element.text}
                            </li>
                        ))}
                    </ul>
                )}
            </div>
            {children}
        </div>
    )
}
