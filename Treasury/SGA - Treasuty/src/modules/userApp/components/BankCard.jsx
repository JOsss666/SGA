import { MoreOptions } from "./MoreOptions";
import "./BankCard.css";

export function BankCard({ info, onDetails }) {
    const { title, description, notifications = 0 } = info;

    const options = [
        {
            text: "Ver cuentas",
            icon: <i className="fa-solid fa-building-columns" />,
        },
        {
            text: "Ver movimientos",
            icon: <i className="fa-solid fa-arrow-right-arrow-left" />,
        },
        {
            text: "Editar banco",
            icon: <i className="fa-solid fa-pencil" />,
        },
    ];

    return (
        <article className="bankCard">
            <div className="bankCardHeader">
                <span className="bankCardLabel">Banco</span>

                <div
                    className="bankCardNotifications"
                    aria-label={`${notifications} notificaciones`}
                    title={`${notifications} notificaciones`}
                >
                    <i className="fa-regular fa-bell" />

                    {notifications > 0 && (
                        <span className="bankCardNotificationCount">
                            {notifications}
                        </span>
                    )}
                </div>
            </div>

            <div className="bankCardContent">
                <h3>{title}</h3>
                <p>{description}</p>
            </div>

            <div className="bankCardActions">
                <button
                    type="button"
                    className="bankCardFavorite"
                    aria-label="Favorito"
                    title="Favorito"
                >
                    <i className="fa-regular fa-heart" />
                </button>

                <button
                    type="button"
                    className="bankCardDetails"
                    onClick={onDetails}
                >
                    Ver detalles
                </button>

                <div className="bankCardOptions">
                    <MoreOptions
                        options={options}
                        children={<i className="fa-solid fa-gear" />}
                    />
                </div>
            </div>
        </article>
    );
}