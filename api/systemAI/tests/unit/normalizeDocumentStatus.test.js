import test from 'node:test';
import assert from 'node:assert/strict';
import normalizeDocumentStatus from '../../tools/executors/normalizeDocumentStatus.js';

test('convierte all en ausencia de filtro SQL', () => {
    assert.equal(normalizeDocumentStatus('all'), undefined);
    assert.equal(normalizeDocumentStatus(' ALL '), undefined);
});

test('conserva estados válidos del enum comercial_state', () => {
    assert.equal(normalizeDocumentStatus(' ACTIVE '), 'active');
});

test('rechaza estados desconocidos antes de consultar PostgreSQL', () => {
    assert.throws(
        () => normalizeDocumentStatus('pending'),
        error => error.code === 'INVALID_TOOL_ARGUMENTS'
    );
});
