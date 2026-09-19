import { useEffect, useRef } from "react";
import "./SearchBar.css";

export function SearchBar({ placeholder, action, value, searchAction, autoFocus }) {

    const inputRef = useRef();

    const handleKeyDown = (event) => {
        if (event.key === "Enter" && searchAction) {
            searchAction(value.trim());
        }
    };

    useEffect(()=>{
        if(autoFocus && inputRef.current){
            inputRef.current.focus();
            const cursorPos = inputRef.current.value.length;
            inputRef.current.setSelectionRange(cursorPos,cursorPos);
        }
    },[autoFocus])

    return (
        <div className="SearchBar">
            <input
                ref={inputRef}
                type="text"
                value={value}
                placeholder={placeholder}
                onChange={(e)=>action(e.target.value)}
                onKeyDown={handleKeyDown}
            />
            <i className="fa-solid fa-magnifying-glass"></i>
        </div>
    );
}
