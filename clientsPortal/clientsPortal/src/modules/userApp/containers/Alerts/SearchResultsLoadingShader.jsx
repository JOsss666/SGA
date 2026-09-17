import './SearchResultsLoadingShader.css';

const sections = [3, 2, 3];

export function SearchResultsLoadingShader({ searchValue = '', compact = false }) {
    const visibleSections = compact ? [2] : sections;

    return (
        <div
            className={`SearchResultsLoadingShader${compact ? ' compact' : ''}`}
            role="status"
            aria-live="polite"
            aria-label={searchValue ? `Buscando resultados para ${searchValue}` : 'Buscando resultados'}
        >
            <span className="shaderAccessibleText">
                {searchValue ? `Buscando resultados para ${searchValue}` : 'Buscando resultados'}
            </span>

            {visibleSections.map((rowCount, sectionIndex) => (
                <section className="shaderSection" aria-hidden="true" key={`shader-section-${sectionIndex}`}>
                    {!compact && (
                        <div className="shaderSectionHead">
                            <span className="shaderBlock shaderSectionIcon"/>
                            <span className="shaderBlock shaderSectionTitle"/>
                        </div>
                    )}

                    <div className="shaderRows">
                        {Array.from({ length: rowCount }, (_, rowIndex) => (
                            <div className="shaderRow" key={`shader-row-${sectionIndex}-${rowIndex}`}>
                                <span className="shaderBlock shaderResultIcon"/>
                                <div className="shaderResultText">
                                    <span className="shaderBlock shaderPrimaryLine"/>
                                    <span className="shaderBlock shaderSecondaryLine"/>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            ))}
        </div>
    );
}
