
import { useAppInfo } from "../../../context/context"
import { BoldTitle } from "../components/BoldTitle";
import { DescriptionSpan } from "../components/DescriptionSpan";

export function HomeProcess(){

    const {userInfo} = useAppInfo();

    return(
        <div className="HomeProcess appSection">
            <BoldTitle text={`Bienvenido ${userInfo.user_name}`}/>
            <DescriptionSpan text={'Lunes 11 de Agosto de 2025'}/>
        </div>
    )
}