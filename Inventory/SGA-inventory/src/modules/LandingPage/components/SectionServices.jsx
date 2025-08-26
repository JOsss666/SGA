
import { MediaHandler } from '../../../../media/MediaHandler';
import { Titles } from './Titles';
import { Paragraph } from './Paragraph';
import './SectionServices.css';

export function SectionServices() {
  return (
    <section className="SectionServices">
        <div className="sectionServicesText">
            <>
                <Titles text={'Qué ofrecemos?'}/>
                <Paragraph text={'En SGA - Inventarios buscamos ofrecer un inventario con todas sus funcionalidades pero adaptado a una nueva era tecnológica y al alcance de todos.'}/>
            </>
        </div>

      <section className="sectionServicesIcons">
        <div className="Icon">
          <span className="icon" aria-hidden="true"><svg  xmlns="http://www.w3.org/2000/svg"  width="24"  height="24"  viewBox="0 0 24 24"  fill="none"  stroke="currentColor"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round"  class="icon icon-tabler icons-tabler-outline icon-tabler-archive"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M3 4m0 2a2 2 0 0 1 2 -2h14a2 2 0 0 1 2 2v0a2 2 0 0 1 -2 2h-14a2 2 0 0 1 -2 -2z" /><path d="M5 8v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2 -2v-10" /><path d="M10 12l4 0" /></svg></span>
          <span className="feature-text">Informes personalizados</span>
        </div>
        <div className="Icon">
          <span className="icon" aria-hidden="true"><svg  xmlns="http://www.w3.org/2000/svg"  width="24"  height="24"  viewBox="0 0 24 24"  fill="none"  stroke="currentColor"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round"  class="icon icon-tabler icons-tabler-outline icon-tabler-clock-record"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M21 12.3a9 9 0 1 0 -8.683 8.694" /><path d="M12 7v5l2 2" /><path d="M19 19m-3 0a3 3 0 1 0 6 0a3 3 0 1 0 -6 0" /></svg></span>
          <span className="feature-text">Control en tiempo real</span>
        </div>
        <div className="Icon">
          <span className="icon" aria-hidden="true"><svg  xmlns="http://www.w3.org/2000/svg"  width="24"  height="24"  viewBox="0 0 24 24"  fill="none"  stroke="currentColor"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round"  class="icon icon-tabler icons-tabler-outline icon-tabler-chart-bar-popular"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M3 13a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v6a1 1 0 0 1 -1 1h-4a1 1 0 0 1 -1 -1z" /><path d="M9 9a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v10a1 1 0 0 1 -1 1h-4a1 1 0 0 1 -1 -1z" /><path d="M15 5a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v14a1 1 0 0 1 -1 1h-4a1 1 0 0 1 -1 -1z" /><path d="M4 20h14" /></svg></span>
          <span className="feature-text">Estadísticas personalizadas</span>
        </div>
        <div className="Icon">
          <span className="icon" aria-hidden="true"><svg  xmlns="http://www.w3.org/2000/svg"  width="24"  height="24"  viewBox="0 0 24 24"  fill="none"  stroke="currentColor"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round"  class="icon icon-tabler icons-tabler-outline icon-tabler-align-box-bottom-center"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M3 3m0 2a2 2 0 0 1 2 -2h14a2 2 0 0 1 2 2v14a2 2 0 0 1 -2 2h-14a2 2 0 0 1 -2 -2z" /><path d="M9 15v2" /><path d="M12 11v6" /><path d="M15 13v4" /></svg></span>
          <span className="feature-text">Reservas y control Clientes</span>
        </div>
        <div className="Icon">
          <span className="icon" aria-hidden="true"><svg  xmlns="http://www.w3.org/2000/svg"  width="24"  height="24"  viewBox="0 0 24 24"  fill="none"  stroke="currentColor"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round"  class="icon icon-tabler icons-tabler-outline icon-tabler-briefcase"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M3 7m0 2a2 2 0 0 1 2 -2h14a2 2 0 0 1 2 2v9a2 2 0 0 1 -2 2h-14a2 2 0 0 1 -2 -2z" /><path d="M8 7v-2a2 2 0 0 1 2 -2h4a2 2 0 0 1 2 2v2" /><path d="M12 12l0 .01" /><path d="M3 13a20 20 0 0 0 18 0" /></svg></span>
          <span className="feature-text">Crea distintas Tiendas y bodegas</span>
        </div>
      </section>
    </section>
  )
}