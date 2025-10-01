

import './HeaderStats.css';

export function HeaderStats({value,text}){

    let sum = (n1,n2)=>{
        return(n1 +n2)
    }

    return(
        <section className='HeaderStats'>
            <div class="stat">
                <div class="value">{value}</div>
                <div class="label">{text}</div>
            </div>
        </section>
    )
}


