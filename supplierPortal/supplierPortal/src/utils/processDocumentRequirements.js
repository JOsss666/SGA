export const requirementType = requirement => requirement.paramdoc_id != null
    ? 'JSON Parametrization' : requirement.docType;

export function missingDocumentRequirements(requirements = [], documents = []) {
    return requirements.filter(requirement => {
        if (requirement.required === false) return false;
        const matching = documents.filter(document => {
            if (document.status === 'cancelled' || document.document_type !== requirementType(requirement)) return false;
            if (requirement.paramdoc_id == null) return true;
            const templateId = document.paramdoc_id ?? document.specialConfig?.paramDoc_id ?? document.specialConfig?.paramdoc_id;
            return templateId != null && String(templateId) === String(requirement.paramdoc_id);
        });
        return matching.length < Number(requirement.min ?? 1);
    });
}
