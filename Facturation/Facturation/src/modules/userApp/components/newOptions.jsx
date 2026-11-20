import { useId, useState } from 'react';
import './newOptions.css';
import { useAlert } from '../../../context/context';

const getSubOptions = option => Array.isArray(option.subOptions) ? option.subOptions : [];

function NewOptionsBranch({ option, index, depth = 0, disabled = false}) {
    const {popInAlert} = useAlert();
    const [expanded, setExpanded] = useState(false);
    const branchId = useId();
    const subOptions = getSubOptions(option);
    const hasSubOptions = subOptions.length > 0;
    const label = option.label ?? option.text ?? `Opción ${index + 1}`;

    return (
        <li className={`newOptionsItem${expanded ? ' newOptionsItemExpanded' : ''}`}>
            <div className={`newOptionsRow ${disabled? 'disabledBranchOption':''}`} style={{ '--newOptionsDepth': depth }}>
                <button
                    className="newOptionsAction"
                    type="button"
                    onClick={()=>{
                        if(disabled){
                            popInAlert(option.warning);
                            return;
                        }
                        else{
                            option.action();
                        }
                    }}
                >
                    <span className="newOptionsIcon" aria-hidden="true">
                        {option.icon || <i className="bi bi-circle" />}
                    </span>
                    <span className="newOptionsLabel">{label}</span>
                    {disabled && (
                        <i className="bi bi-exclamation-circle"/>
                    )}
                </button>
                {hasSubOptions && (
                    <button
                        className="newOptionsDisclosure"
                        type="button"
                        aria-label={`${expanded ? 'Ocultar' : 'Mostrar'} subopciones de ${label}`}
                        aria-expanded={expanded}
                        aria-controls={branchId}
                        onClick={() => setExpanded(value => !value)}
                    >
                        <i className={`bi bi-chevron-${expanded ? 'down' : 'right'}`} aria-hidden="true" />
                    </button>
                )}
            </div>
            {hasSubOptions && (
                <ul className="newOptionsSubList" id={branchId} hidden={!expanded}>
                    {subOptions.map((subOption, subIndex) => (
                        <NewOptionsBranch
                            key={subOption.id ?? `${label}-${subOption.label ?? subOption.text ?? subIndex}`}
                            option={subOption}
                            index={subIndex}
                            depth={depth + 1}
                        />
                    ))}
                </ul>
            )}
        </li>
    );
}

export function NewOptions({ title, options = [], className = '' }) {
    return (
        <div className={`newOptions ${className}`.trim()} aria-label={title || 'Opciones'}>
            {title && <h2 className="newOptionsTitle">{title}</h2>}
            {options.length > 0 ? (
                <ul className="newOptionsList">
                    {options.map((option, index) => (
                        <NewOptionsBranch
                            key={option.id ?? `${option.label ?? option.text ?? 'option'}-${index}`}
                            option={option}
                            index={index}
                            disabled={option.disabled}
                        />
                    ))}
                </ul>
            ) : (
                <p className="newOptionsEmpty">No hay opciones disponibles.</p>
            )}
        </div>
    );
}
