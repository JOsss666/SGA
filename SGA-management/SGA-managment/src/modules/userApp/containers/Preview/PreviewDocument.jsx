import { useEffect,useState } from "react";
import { BoldTitle } from "../../components/BoldTitle";
import './PreviewDocument.css'

export function PreviewDocument(){
    const [darkMode, setDarkMode] = useState(
        window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
    );

    useEffect(() => {
        const root = document.documentElement; // <html>
        if (darkMode) root.classList.add('dark');
        else root.classList.remove('dark');
    }, [darkMode]);

    return(
        <div className="PreviewDocument">
            <div className="headPreview">
                <button onClick={()=>{
                    setDarkMode(!darkMode)
                }}>modo</button>
            </div>
            <BoldTitle text={'Previsualizción Documento'}/>
        </div>
    )
}