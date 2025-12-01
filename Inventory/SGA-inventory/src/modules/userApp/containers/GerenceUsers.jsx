
import { ActionButton } from '../components/actionButton'
import { MovementCard } from '../components/MovementCard'
import { NormalCard } from '../components/NormalCard'
import { SearchBar } from '../components/SearchBar'
import { SectionTitle } from '../components/SectionTitle'
import { SubSectionTitle } from '../components/SubSectionTitle'
import { UserCard } from '../components/UserCard'
import './GerenceUsers.css'

export function GerenceUsers(){
    return(
        <div className="GerenceUsers appSection">
            <SectionTitle text={'Usuarios'}/> 
            <div className="gridGerenceUsers">
                <div className="usersOptions">
                    <NormalCard title={'Crear usuario'} description={'Esta información es la de descripción del atajo.'}/>
                    <NormalCard title={'Eliminar usuario'} description={'Esta información es la de descripción del atajo.'}/>
                    <NormalCard title={'Historial usuarios'} description={'Esta información es la de descripción del atajo.'}/>
                    <NormalCard title={'Historial usuarios'} description={'Esta información es la de descripción del atajo.'}/>
                    <NormalCard title={'Historial usuarios'} description={'Esta información es la de descripción del atajo.'}/>
                </div>
                <div className="usersListContainer">
                    <SubSectionTitle text={'Lista de usuarios'}/>
                    <SearchBar placeholder={'Buscar Usuario'}/>
                    <div className="usersContainer">
                        <UserCard name={'Nombre usuario'} roll={'Cargo usuario'} />
                        <UserCard name={'Nombre usuario'} roll={'Cargo usuario'} />
                        <UserCard name={'Nombre usuario'} roll={'Cargo usuario'} />
                        <UserCard name={'Nombre usuario'} roll={'Cargo usuario'} />
                        <UserCard name={'Nombre usuario'} roll={'Cargo usuario'} />
                        <UserCard name={'Nombre usuario'} roll={'Cargo usuario'} />
                        <UserCard name={'Nombre usuario'} roll={'Cargo usuario'} />
                        <UserCard name={'Nombre usuario'} roll={'Cargo usuario'} />
                        <UserCard name={'Nombre usuario'} roll={'Cargo usuario'} />
                        <UserCard name={'Nombre usuario'} roll={'Cargo usuario'} />
                        <UserCard name={'Nombre usuario'} roll={'Cargo usuario'} />
                        <UserCard name={'Nombre usuario'} roll={'Cargo usuario'} />
                        <UserCard name={'Nombre usuario'} roll={'Cargo usuario'} />
                    </div>
                </div>
                <div className="usersMovements">
                    <SubSectionTitle text={'Movimientos usuarios'}/>
                    <div className="movementsUsersContainer">
                        <MovementCard/>
                        <MovementCard/>
                        <MovementCard/>
                        <MovementCard/>
                        <MovementCard/>
                        <MovementCard/>
                        <MovementCard/>
                        <MovementCard/>
                    </div>
                    <ActionButton text={'Ver movimientos'}/>
                </div>
            </div>
        </div>
    )
}