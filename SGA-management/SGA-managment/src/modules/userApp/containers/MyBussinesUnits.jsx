
import './MyBussinesUnits.css';
import { BoldTitle } from '../components/BoldTitle';
import { DescriptionSpan } from '../components/DescriptionSpan';
import { CardMyBussinesUnits } from '../components/CardMyBussinesUnits';
import ImageUnits from '../../../assets/MyBussinesUnits.png';
import { SearchBar } from '../components/SearchBar';
import { SelectOptions } from '../components/SelectOptions';
import { FormButton } from '../components/FormButton';


export function MyBussinesUnits(){

    const bussinesUnits = [
        {
            title: 'Tienda No. 1',
            text: 'Call 123 # 45 - 8',
            image: ImageUnits
        },
        {   
            title: 'Tienda No. 2',
            text: 'Call 987 # 65 - 4',
            image: ImageUnits  
        },
        {
            title: 'Tienda No. 3',
            text: 'Call 456 # 78 - 9',
            image: ImageUnits
        },
    ];



    return(
        <div className='MyBussinesUnits'>
            <div className="headMyBussinesUnits">
                <BoldTitle text={'Unidades de Negocio'}/>
                <DescriptionSpan text={'Analiza, gestiona y parametriza los módulos de tu empresa'}/>
            </div>
            <div className="bodyMyBussinesUnits">
                <div className="StoresContainer">
                    <div className="FilterUnits">
                        <SearchBar placeholder={'Buscar'}/>
                        <SelectOptions title={'Filtro'} options={['']}/>
                        <FormButton text={'+ Crear Nuevo'}/>
                    </div>
                    <div className="GaleryUnists">
                        <CardMyBussinesUnits title={bussinesUnits[0].title} text={bussinesUnits[0].text} image={bussinesUnits[0].image}/>
                        <CardMyBussinesUnits title={bussinesUnits[1].title} text={bussinesUnits[1].text} image={bussinesUnits[1].image}/>
                        <CardMyBussinesUnits title={bussinesUnits[2].title} text={bussinesUnits[2].text} image={bussinesUnits[2].image}/>
                        <CardMyBussinesUnits title={bussinesUnits[2].title} text={bussinesUnits[2].text} image={bussinesUnits[2].image}/>
                        <CardMyBussinesUnits title={bussinesUnits[2].title} text={bussinesUnits[2].text} image={bussinesUnits[2].image}/>
                    </div>
                </div>
                <div className="maps">
                    <div className="map">
                        <iframe title='map' src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3976.218263201659!2d-74.0817496852292!3d4.609710343512634!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x8e3f99f6f1f39edb%3A0x7c9375a5a6c5a5e2!2sBogot%C3%A1%2C%20Colombia!5e0!3m2!1ses-419!2sus!4v1696354867975!5m2!1ses-419!2sus" width="600" height="450" style={{border:0}} allowFullScreen="" loading="lazy" referrerPolicy="no-referrer-when-downgrade"></iframe>
                    </div>
                    <div className="mapMenu">
                        
                    </div>
                </div>
            </div>
        </div>
    )
}
