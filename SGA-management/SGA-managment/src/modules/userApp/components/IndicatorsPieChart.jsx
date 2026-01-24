import { PieChart, Pie, Cell, Tooltip } from "recharts"

export function IndicatorsPieChart({ indicators }) {
    return (
        <PieChart width={260} height={260}>
            <Pie
                data={indicators}
                dataKey="percentage"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={95}
                label={false}
            >
                {indicators.map((indicator, index) => (
                    <Cell key={index} fill={indicator.color} />
                ))}
            </Pie>

            <Tooltip />
        </PieChart>
    )
}
