import { useAppInfo } from "../../../../context/context";
import { BoldTitle } from "../../components/BoldTitle";
import { CardTitleLogo } from "../../components/CardTitleLogo";
import { DescriptionSpan } from "../../components/DescriptionSpan";
import { SearchBar } from "../../components/SearchBar";
import { ServiceBubble } from "../../components/ServiceBubble";
import { ServiceSgaCard } from "../../components/ServiceSgaCard";
import './ShareDocument.css'

export function ShareDocuments({info}){

    const {appInfo} = useAppInfo();

    return(
        <div className="ShareDocuments">
            <div className="headShare">
                <BoldTitle children={<i className="fa-solid fa-share"/>} text={'Compartir'}/>
                <DescriptionSpan text={`Comparte el documeto ${info.docType}#${info.id}`} />
            </div>
            <div className="bodyShare">
                <div className="MembersShare">
                    <div className="headMemberShares">
                        <div className="inconHMS">
                            <i className="fa-solid fa-people-robbery"/>
                        </div>
                        <div className="infoHMS">
                            <BoldTitle text={`Compartir con miembros de ${appInfo.legal_name}`}/>
                        </div>
                    </div>
                    <SearchBar placeholder={'Buscar miembro'}/>
                </div>
            </div>
            <div className="quickShare">
                <div className="quickShareOptions">
                    <CardTitleLogo title={'Copiar Link de Visualización'}>
                        <i className="fa-regular fa-copy"/>
                    </CardTitleLogo>
                    <CardTitleLogo title={'Copiar Link de Descarga'}>
                        <i className="fa-regular fa-copy"/>
                    </CardTitleLogo>
                    <CardTitleLogo title={'Copiar imágen'}>
                        <i className="fa-regular fa-copy"/>
                    </CardTitleLogo>
                </div>
                <div className="gridBubbleOptions">
                    <ServiceBubble title={'WhatsApp'} imgRef={'https://i.pinimg.com/736x/5a/c2/01/5ac2014fef9c475cbfe1528dda8879e2.jpg'}/>
                    <ServiceBubble title={'Instagram'} imgRef={'https://i.pinimg.com/736x/19/42/d5/1942d5deb0f788e6228054cd92767ff6.jpg'}/>
                    <ServiceBubble title={'Gmail'} imgRef={'https://i.pinimg.com/1200x/26/c7/08/26c7089c48f9bb763e9cca3db502bd57.jpg'}/>
                </div>
            </div>
        </div>
    )
}