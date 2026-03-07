import './HeadMenuSection.css';

export function HeadMenuSection({ title, path, action }) {
    
    const handleHover = () => {
        console.log('hovered:', title);
        action?.(path);
    };

    return (
        <h3 
            className="HeadMenuSection" 
            title={title}
            onMouseEnter={handleHover} 
        >
            {title}
        </h3>
    );
}