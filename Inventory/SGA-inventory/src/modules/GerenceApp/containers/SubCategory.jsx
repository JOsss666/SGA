import { useEffect, useState } from "react"
import './SubCategory.css'
import { CreateNewSubSection } from "../componets/CreateNewSubSection";
import { postInfo } from "../../../utils/functions";
import { CreateNewProduct } from "../componets/CreateNewProduct";
import { ProductTreeCard } from "../componets/ProductTreeCard";

export function SubCategory({info,maxF}){
    const [visibleChildren,setVisibleChildren] = useState(false);
    const [children,setChildren] = useState([]);
    const [products,setProducts] = useState([]);
    const [loading,setLoading] = useState(false);
    
    const getChildren = async()=>{
        setLoading(true);
        let res = await postInfo('/getSubCategories',info.father_id != undefined? info.subCategory_id:0);
        setChildren(res[1]);
        console.log(res);
        setLoading(false);
    }

    const getProducts = async()=>{
        info.tree = true;
        let res = await postInfo('/getProducts',info);
        setProducts(res[1])
    }

    useEffect(()=>{
        console.log(products)
    },[products])

    useEffect(()=>{
        if(visibleChildren && children.length == 0){
            getChildren();
            getProducts()
        }
    },[visibleChildren])

    return(
        <div className="SubCategory">
            <div className="contentSub">
                {!maxF && (
                    <div className="borderTreeIndicator"/>
                )}
                <div className={`actualSubCategory ${maxF==true? 'noLeftM':''}`}>
                    <span onClick={async()=>{setVisibleChildren(!visibleChildren)}}> <div className="tagColor"/> {info.father_id!=undefined? info.subCategory_name:info.category_name } <i className={`fa-solid fa-angle-${visibleChildren? 'up':'down'}`}/></span>
                    {!loading && visibleChildren && products.length > 0 &&(
                        <div className="productsContainer">
                            {products.map((element,index)=>(
                                <ProductTreeCard info={element} key={index}/>
                            ))}
                        </div>
                    )}
                    {!loading && visibleChildren && children.length > 0 && (
                        <div className="ChildrenContainer">
                            {children.map((element,index)=>(
                                <SubCategory info={element} key={index}/>
                            ))}
                            <CreateNewSubSection father={info} reloadFun={getChildren}/>
                            <CreateNewProduct father={info} reloadFun={getProducts}/>
                        </div>
                    )}
                    {!loading && visibleChildren && children.length == 0 && (
                        <>
                            <CreateNewSubSection father={info} reloadFun={getChildren}/>
                            <CreateNewProduct father={info}/>
                        </>
                    )}
                    {loading && (
                        <span>Cargando ...</span>
                    )}
                </div>
            </div>
        </div>
    )
}