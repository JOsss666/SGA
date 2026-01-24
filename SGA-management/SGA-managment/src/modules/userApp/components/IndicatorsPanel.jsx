import { DescriptionSpan } from "./DescriptionSpan";
import { IndicatorsPieChart } from "./IndicatorsPieChart";
import "./IndicatorsPanel.css";

export function IndicatorsPanel({ indicators }) {

    const totalValue = indicators.reduce((sum, i) => sum + i.value, 0);

    const indicatorsWithPercentage = indicators.map(indicator => ({
        ...indicator,
        percentage: Math.round((indicator.value / totalValue) * 100)
    }));

    return (
        <div className="Indicators">
            {indicatorsWithPercentage.map((indicator, index) => (
                <div key={index} className="CardIndicator">
                    <div className="HeadCard">
                        <DescriptionSpan text={indicator.name} />
                        <span
                            className="Percentage"
                            style={{ color: indicator.color }}
                        >
                            {indicator.percentage}%
                        </span>
                    </div>

                    <div className="Progress">
                        <div
                            className="ProgressBar"
                            style={{
                                width: `${indicator.percentage}%`,
                                backgroundColor: indicator.color
                            }}
                        />
                    </div>
                </div>
            ))}

            <div className="PieChartWrapper">
                <IndicatorsPieChart indicators={indicatorsWithPercentage} />
            </div>
        </div>
    );
}
