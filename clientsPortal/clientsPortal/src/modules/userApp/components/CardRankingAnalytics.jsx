import { BoldTitle } from './BoldTitle';
import './CardRankingAnalytics.css';
import { PercentTimeIndicator } from './PercentTimeIndicator';
import { MoreOptions } from './MoreOptions';

export function CardRankingAnalytics({ title, value, percent, icon, period}) {

    return (
        <div className="CardRankingAnalytics">
            <h3>{title}</h3>
            <div className="FlexCardRank">
                <BoldTitle text={value}/>
                <PercentTimeIndicator
                    info={{
                        value,
                        period
                    }}
                />
            </div>
            <MoreOptions options={[
                {text:`¿Que es ${title}?`,icon:<i className="fa-solid fa-question"/>},
                {text:`Interpretación de ${title}`,icon:<i className="fa-solid fa-circle-info"/>},
                {text:`Generar informe`,icon:<i className="fa-solid fa-image"/>},
                {text:`Preguntar a la IA`,icon:<i className="fa-solid fa-circle-info"/>}
            ]}/>
        </div>
    );
}
