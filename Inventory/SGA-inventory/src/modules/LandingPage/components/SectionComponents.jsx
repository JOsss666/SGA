

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
                <ComponentsCard title={'Open AI'} children={<i className="fa-solid fa-frog"/>} />
                <ComponentsCard title={'Contabilidad'} description={'Hola mundo'} children={<i className="fa-solid fa-frog"/>}/>
                <ComponentsCard title={'Procesos'} children={<i className="fa-solid fa-frog"/>}/>
                <ComponentsCard title={'Tesoretía'} children={<i className="fa-solid fa-frog"/>}/>
                <ComponentsCard title={'Facturación'} children={<i className="fa-solid fa-frog"/>}/>
                </>
            </div>
        </section>
    )
}