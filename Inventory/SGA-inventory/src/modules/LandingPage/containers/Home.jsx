import { HeaderSection } from '../components/HeaderSection'
import { SectionServices } from '../components/SectionServices'
import { StartSection } from '../components/StartSection'
import { SectionComponents } from '../components/SectionComponents'
import './Home.css'

export function Home(){
    return(
        <div className="Home">
            <>
                <HeaderSection/>
                <SectionServices/>
                <SectionComponents/>
                <StartSection/>
            </>
        </div>
    )
}