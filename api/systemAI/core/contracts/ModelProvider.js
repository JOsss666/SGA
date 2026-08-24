class ModelProvider {
    async generate() {
        throw new Error('El proveedor debe implementar generate().');
    }
}

export default ModelProvider;
