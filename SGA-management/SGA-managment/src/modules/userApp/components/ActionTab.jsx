import './ActionTab.css';

export function ActionTab({ label }) {
    return (
        <div className="ActionTab">
            <i className="fa-regular fa-flag icon"/>
            <span>{label}</span>
        </div>
    )
}
