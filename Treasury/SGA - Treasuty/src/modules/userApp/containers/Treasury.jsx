import { useEffect, useState } from "react";
import { FormNewTreasury } from "./forms/FormNewTreasury";
import { useAlert, useAppInfo } from "../../../context/context";
import { BoldTitle } from "../components/BoldTitle";
import { DescriptionSpan } from "../components/DescriptionSpan";
import { SearchBar } from "../components/SearchBar";
import { SelectOptions } from "../components/SelectOptions";
import { FormButton } from "../components/FormButton";
import { NormalCard } from "../components/NormalCard";
import { LoadingSpace } from "./LoadingSpace";
import { postInfo } from "../../../utils/functions";
import "./Treasury.css";

/* TEMPORAL */
const MOCK_TREASURY = [
    {
        id: 1,
        name: "Caja 1",
        img: "https://res.cloudinary.com/djjxugmni/image/upload/v1764619633/ChatGPT_Image_1_dic_2025_15_04_38_2_hwmmk5.png"
    },
    {
        id: 2,
        name: "Caja 2",
        img: "https://res.cloudinary.com/djjxugmni/image/upload/v1764619633/ChatGPT_Image_1_dic_2025_15_04_38_2_hwmmk5.png"
    },
    {
        id: 3,
        name: "Tienda No 2",
        img: "https://res.cloudinary.com/djjxugmni/image/upload/v1764619633/ChatGPT_Image_1_dic_2025_15_04_38_2_hwmmk5.png"
    }
];

export function Treasury() {

    const { popInAlert } = useAlert();
    const { appInfo } = useAppInfo();

    const [treasury, setTreasury] = useState([]);
    const [loading, setLoading] = useState(false);

    const getTreasury = async () => {
        setLoading(true);

        const res = await postInfo("/treasury/getTreasury", {
            company_id: appInfo.company_id
        });

        if (res[0] && res[1]?.length > 0) {
            setTreasury(res[1]);
        } else {
            setTreasury(MOCK_TREASURY);
        }

        setLoading(false);
    };

    useEffect(() => {
        setTreasury(MOCK_TREASURY);
        // getTreasury();
    }, []);

    return (
        <div className="Treasury">

            <div className="HeadTreasury">
                <BoldTitle text="Cajas y Tesorería" />
                <DescriptionSpan text="Analiza, gestiona y parametriza los módulos de tu empresa" />
            </div>

            <div className="MenuBarTreasury">
                <SearchBar placeholder="Buscar" />

                <i className="fa-solid fa-bars IconList" />
                <i className="fa-solid fa-table-cells-large IconList" />

                <SelectOptions
                    title="Orden"
                    options={["Ascendente", "Descendente"]}
                />

                <FormButton
                    text="Crear nuevo"
                    onClick={() =>
                        popInAlert(
                            <FormNewTreasury reloadFun={getTreasury} />
                        )
                    }
                >
                    <i className="fa-solid fa-plus" />
                </FormButton>
            </div>

            {!loading && (
                <div className="GalleryTreasury">
                    {treasury.length > 0 ? (
                        treasury.map((element) => (
                            <NormalCard
                                key={element.id}
                                title={element.name}
                                img={element.img}
                                onlyTitle={true}
                            />
                        ))
                    ) : (
                        <p>No hay tesorerías registradas</p>
                    )}
                </div>
            )}

            {loading && (
                <LoadingSpace
                    title="Cargando tesorerías"
                    description="Esto no debe tardar mucho..."
                />
            )}
        </div>
    );
}
