import './svgIcons.css';

export function DebitCardIcon() {
    return (
        <svg
        className="iconMenuSvg noFillSvg"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        >
        {/* Banda superior */}
        <path
            d="M2 8.5H22"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
        />

        {/* Detalles inferiores */}
        <path
            d="M6 16.5H8"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
        />
        <path
            d="M10.5 16.5H14.5"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
        />

        {/* Contorno */}
        <path
            d="M6.5 3.5H17.5C20.5 3.5 21.5 4.5 21.5 7.5V16.5C21.5 19.5 20.5 20.5 17.5 20.5H6.5C3.5 20.5 2.5 19.5 2.5 16.5V7.5C2.5 4.5 3.5 3.5 6.5 3.5Z"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinejoin="round"
        />
        </svg>
    );
}
