import './svgIcons.css';

export function MessagesIcon() {
    return (
        <svg
        className="iconMenuSvg noFillSvg"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        >
        {/* Burbuja principal */}
        <path
            d="M4 5.5H14C16.5 5.5 18 7 18 9.5V13C18 15.5 16.5 17 14 17H8L4 20V9.5C4 7 5.5 5.5 8 5.5Z"
        />

        {/* Burbuja secundaria */}
        <path
            d="M10 3.5H18C20 3.5 21.5 5 21.5 7.5V11C21.5 13 20.2 14.4 18.3 14.5"
        />
        </svg>
    );
}
