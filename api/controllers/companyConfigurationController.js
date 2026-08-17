import companyConfigurationService from '../services/companyConfigurationService.js';

const companyConfigurationController = {};

companyConfigurationController.clone = async (req, res) => {
    try {
        const result = await companyConfigurationService.clone(req.body);
        res.status(result.dry_run ? 200 : 201).json({
            ok: true,
            message: result.dry_run
                ? 'Vista previa completada; no se guardaron cambios.'
                : 'Configuración copiada correctamente.',
            data: result
        });
    } catch (error) {
        console.error('Error al copiar la configuración de compañía:', error);
        const isValidationError = /compañía|company_id|configuración/i.test(error.message || '');
        res.status(isValidationError ? 400 : 500).json({
            ok: false,
            message: error.message || 'No fue posible copiar la configuración.'
        });
    }
};

export default companyConfigurationController;
