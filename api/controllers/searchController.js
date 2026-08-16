import searchInApp from '../services/searchService.js';

const searchController = {};

searchController.search = async (req, res) => {
    try {
        const { searchValue, company_id, user_id, category, page } = req.body;
        const results = await searchInApp(searchValue, { company_id, user_id, category, page });
        res.status(200).json(results);
    } catch (error) {
        console.error('Error en searchController.search:', error);
        res.status(500).json({ ok: false, message: error.message || 'No fue posible completar la búsqueda.' });
    }
};

export default searchController;
