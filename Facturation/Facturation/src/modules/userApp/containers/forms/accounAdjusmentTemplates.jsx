import { useEffect, useMemo, useState } from 'react';
import { useAlert } from '../../../../context/context';
import { BoldTitle } from '../../components/BoldTitle';
import './accounAdjusmentTemplates.css';

const formatCreationDate = value => {
    if (!value) return '--';

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '--';

    return new Intl.DateTimeFormat('es-CO').format(date);
};

export function AccounAdjusmentTemplates({ templates = [], loadTemplates, onApply, onDelete }) {
    const { popOutAlert } = useAlert();
    const [templateList, setTemplateList] = useState(templates);
    const [searchValue, setSearchValue] = useState('');
    const [loading, setLoading] = useState(false);
    const [loadError, setLoadError] = useState('');
    const [deletingTemplateId, setDeletingTemplateId] = useState(null);

    useEffect(() => {
        let active = true;
        setLoading(true);
        setLoadError('');

        Promise.resolve()
            .then(() => (loadTemplates ? loadTemplates() : templates))
            .then(loadedTemplates => {
                if (active && Array.isArray(loadedTemplates)) setTemplateList(loadedTemplates);
            })
            .catch(error => {
                if (active) setLoadError(error?.message ?? 'No fue posible cargar las plantillas.');
            })
            .finally(() => {
                if (active) setLoading(false);
            });

        return () => {
            active = false;
        };
    }, [loadTemplates, templates]);

    const filteredTemplates = useMemo(() => {
        const query = searchValue.trim().toLocaleLowerCase('es');
        if (!query) return templateList;

        return templateList.filter(template => (
            `${template.name ?? ''} ${template.description ?? ''}`
                .toLocaleLowerCase('es')
                .includes(query)
        ));
    }, [searchValue, templateList]);

    const applyTemplate = template => {
        onApply?.(template);
        popOutAlert();
    };

    const deleteTemplate = async (event, template) => {
        event.stopPropagation();
        setDeletingTemplateId(template.id);

        try {
            const deleted = await onDelete?.(template);
            if (deleted) {
                setTemplateList(current => current.filter(item => item.id !== template.id));
            }
        } finally {
            setDeletingTemplateId(null);
        }
    };

    return (
        <section className="accounAdjusmentTemplates" aria-label="Plantillas recurrentes de ajustes contables">
            <BoldTitle text="Plantillas recurrentes" />

            <label className="accounAdjusmentTemplatesSearch">
                <i className="fa-solid fa-magnifying-glass" aria-hidden="true" />
                <input
                    type="search"
                    aria-label="Buscar plantillas"
                    value={searchValue}
                    onChange={event => setSearchValue(event.target.value)}
                    placeholder="Buscar plantilla"
                />
            </label>

            {loadError && <p className="accounAdjusmentTemplatesMessage" role="alert">{loadError}</p>}
            {loading && <p className="accounAdjusmentTemplatesMessage" role="status">Cargando plantillas…</p>}

            {!loading && !loadError && templateList.length === 0 && (
                <p className="accounAdjusmentTemplatesMessage">No hay plantillas recurrentes guardadas.</p>
            )}

            {!loading && !loadError && templateList.length > 0 && filteredTemplates.length === 0 && (
                <p className="accounAdjusmentTemplatesMessage">No se encontraron plantillas.</p>
            )}

            <div className="accounAdjusmentTemplatesList">
                {filteredTemplates.map(template => (
                    <div className="accounAdjusmentTemplatesCard" key={template.id}>
                        <button
                            className="accounAdjusmentTemplatesSelect"
                            type="button"
                            aria-label={`Usar plantilla ${template.name}`}
                            onClick={() => applyTemplate(template)}
                        >
                            <strong>
                                {template.name} <time>({formatCreationDate(template.created_at)})</time>
                            </strong>
                            <span>{template.description || '--'}</span>
                        </button>
                        <button
                            type="button"
                            className="accounAdjusmentTemplatesDelete"
                            aria-label={`Eliminar plantilla ${template.name}`}
                            title={`Eliminar plantilla ${template.name}`}
                            disabled={deletingTemplateId === template.id}
                            onClick={event => deleteTemplate(event, template)}
                        >
                            <i
                                className={`fa-solid ${deletingTemplateId === template.id ? 'fa-spinner fa-spin' : 'fa-trash-can'}`}
                                aria-hidden="true"
                            />
                        </button>
                    </div>
                ))}
            </div>
        </section>
    );
}
