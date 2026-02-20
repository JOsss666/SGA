import { useEffect, useRef, useState } from 'react'
import './SearchInList.css'

export function SearchinList({title, placeHolder, list, disabled, action, children, specialOption, noActVal}){
    
    const [searchValue, setSearchValue] = useState('');
    const [visibleList, setVisibleList] = useState(false);
    const [selectedOption, setSelectedOption] = useState(noActVal ? undefined : "");
    const [focusedIndex, setFocusedIndex] = useState(-1);
    
    const inRef = useRef();
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
    }, [focusedIndex, visibleList]); 
    // ----------------------------------

    const handleSelect = (element) => {
        if(!noActVal){
            inRef.current.value = element.text;
            setSelectedOption(element.value !== undefined ? element.value : element.text);
        } else {
            if(action) action(element.value !== undefined ? element.value : element.text);
        }
        setVisibleList(false);
        setFocusedIndex(-1);
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

    useEffect(() => {
        console.log(selectedOption)
        if(selectedOption !== undefined && action !== undefined){
            action(selectedOption);
        }
    }, [selectedOption]);

    return(
        <div className="SearchinList" onBlur={(e) => {
            if (!e.currentTarget.contains(e.relatedTarget)) {
                setVisibleList(false);
            }
        }}>  
            {title && <label>{title}</label>}
            <div className="SlistC">
                <input 
                    ref={inRef} 
                    type="text" 
                    placeholder={disabled ? "Sin opciones disponibles" : placeHolder} 
                    disabled={disabled} 
                    onFocus={() => setVisibleList(true)}
                    onKeyDown={handleKeyDown}
                    onChange={(e) => {
                        setSearchValue(e.target.value);
                        setSelectedOption('');
                        setFocusedIndex(-1);
                    }}
                />
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