import './ThirdPartyCard.css';

export function ThirdPartyCard({ thirdParty, onCardClick }) {
    const handleClick = () => {
        onCardClick(thirdParty.id);
    };

    const handleButtonClick = (e, action) => {
        e.stopPropagation();
        console.log(`${action} clicked for:`, thirdParty.id);
    };

    const getDisplayName = () => {
        return thirdParty.name || thirdParty.legal_name || thirdParty.trade_name || 'Nombre no disponible';
    };

    const getDisplayEmail = () => {
        return thirdParty.email || thirdParty.company_mail || 'Email no disponible';
    };

    const getDisplayPhone = () => {
        return thirdParty.phone || thirdParty.contact_phone || 'Teléfono no disponible';
    };

    return (
        <div className="ThirdpartyCard" onClick={handleClick}>
            <div className="CardContent">
                <div className="CardHeader">
                    <div className="NameSection">
                        <i className="far fa-user"></i>
                        <span className="ThirdpartyName">{getDisplayName()}</span>
                    </div>
                    <div className="CardActions">
                        <button type="Button" className="btn-edit" onClick={(e) => handleButtonClick(e, 'edit')}>
                            <i className="far fa-edit"></i>
                        </button>
                        <button type="Button" className="btn-delete" onClick={(e) => handleButtonClick(e, 'delete')}>
                            <i className="far fa-trash-alt"></i>
                        </button>
                    </div>
                </div>

                <div className="ContactInfo">
                    <div className="ContactItem">
                        <i className="far fa-envelope"></i>
                        <span className="ContactText">{getDisplayEmail()}</span>
                    </div>
                    <div className="ContactItem">
                        <i className="fa-solid fa-phone"></i>
                        <span className="ContactText">{getDisplayPhone()}</span>
                    </div>
                </div>
            </div>
            <div className="ImageSection">
                <div className="ImagePlaceholder">
                    <span></span>
                </div>
            </div>
        </div>
    );
}