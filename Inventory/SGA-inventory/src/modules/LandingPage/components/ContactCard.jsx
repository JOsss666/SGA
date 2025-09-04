

import './ContactCard.css';

export function ContactCard({icon,title,description,children}){
    return(
        <div className="ContactCard" >
            <i className="fa-regular fa-message IconInfo"/>
            <div className="Icon">
                {icon}
            </div>
            <div className="Question">
                <h3>{title}</h3>
            </div>
            <div className="Description">
                <p>{description}</p>
            </div>
            <div className="Link">
                <strong><a href="#">{children}</a></strong>
            </div>
        </div>
    )
}