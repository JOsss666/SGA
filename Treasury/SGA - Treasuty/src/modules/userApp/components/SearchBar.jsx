import { useRef } from "react";
import "./SearchBar.css";

export function SearchBar({ placeholder, action, value, searchAction }) {

    const handleKeyDown = (event) => {
        if (event.key === "Enter" && searchAction) {
            searchAction(value.trim());
        }
    };

    return (
        <div className="SearchBar">
            <input
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
