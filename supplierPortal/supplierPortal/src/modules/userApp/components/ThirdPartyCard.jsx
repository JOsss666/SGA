import './ThirdPartyCard.css';
import { useAppInfo, useNotifications } from '../../../context/context';
import { postInfo } from '../../../utils/functions';
import { MoreOptions } from './MoreOptions';

export function ThirdPartyCard({ info, onCardClick, onEdit, reloadFun }) {
    const { appInfo, userConfig, userInfo } = useAppInfo();
    const { addNotification } = useNotifications();

    const handleClick = () => {
        onCardClick(info.id);
    };

    const deleteThirdParty = async () => {
        const confirmed = window.confirm(
            `¿Deseas eliminar a "${info.names}"? Esta acción solo se realizará si el tercero no tiene movimientos asociados.`
        );

        if (!confirmed) return;

        try {
            const response = await postInfo('/deleteThirdParty', {
                thirdParty_id: info.id,
                company_id: appInfo.company_id,
                performed_by: userInfo.user_name ?? userInfo.user_id
            });

            if (!response?.[0]) {
                throw new Error(response?.[1]?.message ?? 'No se pudo eliminar el tercero.');
            }

            addNotification({
                type: 'aproved',
                title: 'Tercero eliminado',
                description: `El tercero "${info.names}" fue eliminado correctamente.`
            });
            await reloadFun?.();
        } catch (error) {
            addNotification({
                type: 'error',
                title: 'No fue posible eliminar el tercero',
                description: error?.message
                    ?? 'El tercero tiene movimientos asociados o se produjo un error al eliminarlo.'
            });
        }
    };

    const options = [
        {
            text: 'Ver detalles',
            icon: <i className="fa-solid fa-circle-info" />,
            action: handleClick
        },
        ...(userConfig?.access?.sections?.thirdparties?.can_edit ? [{
            text: 'Editar',
            icon: <i className="fa-solid fa-pencil" />,
            action: () => (onEdit ?? onCardClick)(info.id)
        }] : []),
        ...(userConfig?.access?.sections?.thirdparties?.can_delete ? [{
            text: 'Eliminar',
            icon: <i className="fa-solid fa-trash" />,
            action: deleteThirdParty
        }] : [])
    ];

    return (
        <div className="ThirdpartyCard" onClick={handleClick}>
            <div className="ImageSection">
                <img src={info.img} className='ImagePlaceholder' alt="" />
            </div>
            <div className="CardContent">
                <div className="CardHeader">
                    <div className="NameSection">
                        <i className="far fa-user"></i>
                        <span className="ThirdpartyName">{info.names}</span>
                    </div>
                    <div className="CardActions" onClick={(event) => event.stopPropagation()}>
                        <MoreOptions options={options} />
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
        </div>
    );
}
