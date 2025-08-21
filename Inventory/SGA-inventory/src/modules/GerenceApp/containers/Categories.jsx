import { useEffect, useState } from "react";
import { SectionTitle } from "../componets/SectionTitle";
import './Categories.css'
import { SubCategory } from "./SubCategory";
import { postInfo } from "../../../utils/functions";

export function Categories(){

    const [categories,setCategories] = useState([]);
    const getCategories = async()=>{
        let res = await postInfo('/getCategories',1);
        setCategories(res[1]);
    }

    useEffect(()=>{
        getCategories();
    },[])

    return(
        <div className="Categories appSection">
            <SectionTitle text={'Categorias'}/>
            <div className="categoriesSpace">
                {categories.length > 0 && categories.map((element,index)=>(
                    <SubCategory info={element} key={index} maxF={true}/>
                ))}
            </div>
        </div>
    )
}