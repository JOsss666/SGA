import { forwardRef } from 'react';
import './AiAddHandler.css';

const normalizeSearchText = value => value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLocaleLowerCase('es');

const filterAiAddOptionGroups = (groups, query) => {
    const normalizedQuery = normalizeSearchText(query.trim());

    return groups
        .map(group => ({
            ...group,
            options:group.options.filter(option => (
                normalizeSearchText(`${option.title} ${option.description}`)
                    .includes(normalizedQuery)
            ))
        }))
        .filter(group => group.options.length > 0);
};

export const AiAddHandler = forwardRef(function AiAddHandler({groups, query, onSelect}, ref) {
    const filteredGroups = filterAiAddOptionGroups(groups, query);

    return (
        <div ref={ref} className="AiAddHandler" role="dialog" aria-label="Agregar contexto al chat">
            <div className="aiAddHandlerContent">
                {filteredGroups.map(group => (
                    <section className="aiAddHandlerGroup" key={group.title}>
                        <h3>{group.title}</h3>
                        {group.options.map(option => (
                            <button
                                type="button"
                                className="aiAddHandlerOption"
                                key={option.title}
                                disabled={!option.action}
                                onClick={() => onSelect(option)}
                            >
                                <i className={`fa-solid ${option.icon}`} aria-hidden="true"/>
                                <span>
                                    <strong>{option.title}</strong>
                                    <small>{option.description}</small>
                                </span>
                            </button>
                        ))}
                    </section>
                ))}
                {filteredGroups.length === 0 && (
                    <div className="aiAddHandlerEmpty" role="status">
                        <i className="fa-solid fa-magnifying-glass" aria-hidden="true"/>
                        <span>No encontramos opciones para “{query}”.</span>
                    </div>
                )}
            </div>
        </div>
    );
});

AiAddHandler.filterGroups = filterAiAddOptionGroups;
