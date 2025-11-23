import './ThirdPartyCard.css';

export function ThirdPartyCard({ info, onCardClick }) {
    const handleClick = () => {
        onCardClick(info.id);
    };

    const handleButtonClick = (e, action) => {
        e.stopPropagation();
        console.log(`${action} clicked for:`, thirdParty.id);
    };


    return (
        <div className="ThirdpartyCard" onClick={handleClick}>
            <div className="CardContent">
                <div className="CardHeader">
                    <div className="NameSection">
                        <i className="far fa-user"></i>
                        <span className="ThirdpartyName">{info.names}</span>
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
                        <span className="ContactText">{info.mail}</span>
                    </div>
                    <div className="ContactItem">
                        <i className="fa-solid fa-phone"></i>
                        <span className="ContactText">{info.phone}</span>
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