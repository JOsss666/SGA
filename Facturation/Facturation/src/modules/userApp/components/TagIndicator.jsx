import './TagIndicator.css'

const typeIcons = {
    active: 'fa-solid fa-circle-check',
    success: 'fa-solid fa-circle-check',
    pending: 'fa-solid fa-triangle-exclamation',
    warning: 'fa-solid fa-triangle-exclamation',
    in_progress: 'fa-solid fa-spinner',
    inProgress: 'fa-solid fa-spinner',
    submitted: 'fa-solid fa-paper-plane',
    in_review: 'fa-solid fa-magnifying-glass',
    inReview: 'fa-solid fa-magnifying-glass',
    review: 'fa-solid fa-magnifying-glass',
    failed: 'fa-solid fa-circle-xmark',
    cancelled: 'fa-solid fa-circle-xmark',
    canceled: 'fa-solid fa-circle-xmark',
    expired: 'fa-solid fa-clock',
    disabled: 'fa-solid fa-ban',
    suspended: 'fa-solid fa-clock',
    indicator: 'fa-solid fa-certificate',
    category: 'fa-solid fa-layer-group',
    green: 'fa-solid fa-scroll',
    blue: 'fa-solid fa-certificate',
    info: 'fa-solid fa-circle-info',
    purple: 'fa-solid fa-leaf',
};

export function TagIndicator({desc,title,type,children,classN = '',icon}){
    const iconClass = icon === undefined
        ? typeIcons[type] ?? 'fa-solid fa-circle-check'
        : icon;

    return(
        <div title={desc} className={`TagIndicator ${type ? `${type}_color` : ''} ${classN}`}>
            {iconClass && (
                <span className="tagIndicatorIcon" aria-hidden="true">
                    <i className={iconClass}/>
                </span>
            )}
            <h5>{title}</h5>
            {children}
        </div>
    )
}
