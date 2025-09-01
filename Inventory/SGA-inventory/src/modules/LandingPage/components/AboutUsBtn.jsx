import  './AboutUsBtn.css'

export function AboutUsBtn({text}){
    return(
        <button className='AboutUsBtn'>{text}<i class="fa-solid fa-angle-down"></i></button>
    )
}