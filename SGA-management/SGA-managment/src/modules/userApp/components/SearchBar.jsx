import { useRef } from "react";
import "./SearchBar.css";

export function SearchBar({ placeholder, action, searchAction }) {
    const inRefSearch = useRef();

    const handleKeyDown = (event) => {
        if (event.key === "Enter") {
        if (searchAction) {
            searchAction(inRefSearch.current.value);
        }
        }
    };

    return (
        <div>
            
        <div className="SearchBar">
            <input
            ref={inRefSearch}
            type="text"
            placeholder={placeholder}
            onChange={(e) => {
                if (action) {
                if (e.target.value === " ") {
                    e.target.value = "";
                }
                action(e.target.value);
                }
            }}
            onKeyDown={handleKeyDown} // Agregar evento correctamente
            />
            <i className="fa-solid fa-magnifying-glass"></i>
        </div>
        </div>
    );
}
