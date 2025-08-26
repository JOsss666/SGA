

import './HeaderStats.css';

export function HeaderStats(value, text){

    return(
        <section className='HeaderStats'>
            <div class="stat">
                <div class="value">{value}</div>
                <div class="label">{text}</div>
            </div>
        </section>
    )
}


