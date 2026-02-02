import './SideItem.css';

export function SideItem({ text, active = false }) {
    return (
        <div className={`SideItem ${active ? 'active' : ''}`}>
            <span>{text}</span>
            <i className="fa-regular fa-arrow-right-long icon"/>
        </div>
    );
}
