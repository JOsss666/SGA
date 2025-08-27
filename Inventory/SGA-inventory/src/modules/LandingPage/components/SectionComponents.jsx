

import { Titles } from './Titles'
import { Paragraph } from './Paragraph'
import { ComponentsCard } from './ComponentsCard'
import './SectionComponents.css'

export function SectionComponents(){
    return (
        <section className="SectionComponents">
            <div className="sectionComponentsText">
                <>
                    <Titles text={'Un componente esencial'}/>
                    <Paragraph text={'En SGA - Inventarios buscamos ofrecer un inventario con todas sus funcionalidades pero adaptado a una nueva era tecnológica y al alcance de todos.'}/>
                </>
            </div>
            <div className="SectionComponentsCards">
                <>
                <ComponentsCard/>
                <ComponentsCard/>
                <ComponentsCard/>
                <ComponentsCard/>
                <ComponentsCard/>
                </>
            </div>
        </section>
    )
}