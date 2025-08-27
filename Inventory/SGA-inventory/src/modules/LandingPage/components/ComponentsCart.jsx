
import './ComponentsCart.css';
<<<<<<< HEAD

=======
>>>>>>> origin/test

export function ComponentsCard (icon, title, text, color){
    return (
        <div className="ComponentsCard">
            <div className="cardContent">
                <img src={icon}/>
                <h4 className="cardTitle">{title}</h4>
                <p className="cardText">{text}</p>
            </div>
        </div>
    )
}