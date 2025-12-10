

import './CategoriesDetail.css';
import { BoldTitle } from "../components/BoldTitle";
import { DescriptionSpan } from "../components/DescriptionSpan";
import { PathLocation } from '../components/PathLocation';
import { SearchBar } from '../components/SearchBar';
import { SelectOptions } from '../components/SelectOptions';
import { FormButton } from '../components/FormButton';
import { CardProduct } from '../components/CardProduct';

export function CategoriesDetail(){


    return( 
        <div className="CategoriesDetail">
            <div className="ContentPanel">
                <div className="list">
                    <ul className="CategoriList">
                        <li className="Categori">
                            Categoría 1
                            <ul className="SubcategoriList">
                                <li>Sub-categoría</li>
                                <li>Sub-categoría</li>
                                <li>Sub-categoría</li>
                                <li>Sub-categoría</li>
                            </ul>
                        </li>

                        <li className="Categori">Categoría 1</li>
                        <li className="Categori">Categoría 1</li>
                        <li className="Categori">Categoría 1</li>
                        <li className="Categori">Categoría 1</li>
                        <li className="Categori">Categoría 1</li>
                    </ul>
                </div>
            </div>
            <div className="ContentMain">
                <div className="HeadCategoriesDetail">
                    <BoldTitle text={<PathLocation/>}/>
                    <DescriptionSpan text={'Esta es la descripción de la categoría actual' }/>
                </div>
                <div className="MenuBarCategories">
                    <SearchBar placeholder={'Buscar'}/>
                    <i className="fa-solid fa-bars IconList"/>
                    <i className="fa-solid fa-table-cells-large IconList"/>
                    <SelectOptions title={'Orden'} options={['Ascendente','Descendente']}/>
                    <FormButton onClick={()=>{
                        popInAlert({/*<FormNewUser reloadFun={getUsers}/>*/})
                    }} text={'Añadir producto'} children={<i className="fa-solid fa-plus"/>}/>
                </div>
                <div className="DetailsCategoriesDetail">
                    <CardProduct />
                    <CardProduct />
                    <CardProduct />
                    <CardProduct />
                </div>
            </div>
        </div>
    )
}