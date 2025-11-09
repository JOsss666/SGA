import './ModuleCard.css';

export function ModuleCard({ module, onCardClick, onButtonClick, onSmallButtonClick }) {
    return (
        <div className="module-card" onClick={() => onCardClick(module.id)}>
            <div className="module-header">
                <div className="module-image">
                    <div className="module-image-placeholder">
                        <i className="fa-solid fa-cube"></i>
                    </div>
                </div>
                <div className="module-content">
                    <h3 className="module-title">{module.name}</h3>
                </div>
            </div>
            
            <div className="module-buttons">
                <div className="module-description-container">
                    <p className="module-description">{module.description}</p>
                </div>
                
                <div className="module-actions">
                    <div className="buttons-left">
                        {module.buttons.map((button, index) => (
                            <button
                                key={index}
                                className={`module-btn ${button.action === 'view' ? 'btn-view' : button.action === 'buy' ? 'btn-buy' : 'btn-settings'}`}
                                onClick={(e) => onButtonClick(e, module.id, button.action)}
                            >
                                <i className={button.icon}></i>
                                {button.text}
                            </button>
                        ))}
                    </div>
                    
                    <div className="buttons-right">
                        {module.buttons.map((button, index) => (
                            (button.action === 'view' || button.action === 'buy') && (
                                <button
                                    key={`small-${index}`}
                                    className={`small-btn ${button.action === 'view' ? 'small-btn-green' : 'small-btn-blue'}`}
                                    onClick={(e) => onSmallButtonClick(e, button.action)}
                                >
                                    <div className="circle-icon">
                                        <i className={button.action === 'view' ? 'fa-solid fa-check' : 'fa-solid fa-cart-shopping'}></i>
                                    </div>
                                </button>
                            )
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}