

export function TreeOrganizer({list}){
    return(
        <div className="TreeOrganizer">
            {list.map((element,index)=>(
                <div key={index} className="treeItem">
                    <strong>{element.name}</strong>
                    {element.children != undefined && (
                        <TreeOrganizer list={element.children}/>
                    )}
                </div>
            ))}
        </div>
    )
}