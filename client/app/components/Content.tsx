"use client";
import { useLaserEyes } from "@omnisat/lasereyes";
import { useEffect, useState } from "react";
import axios from "axios"


const Content = () => {
    const {
        connected,
        paymentAddress,
        paymentPublicKey,
        signPsbt,
    } = useLaserEyes();
    const [img1, setImg1] = useState("");
    const [imgData, setImgData] = useState<any>();

    const getFileBase64 = (file: any, callback: (url: string) => void) => {
        const reader = new FileReader();
        reader.addEventListener('load', () => callback(reader.result as string));
        reader.readAsDataURL(file);
    };

    const changeHandler = (e: any) => {
        setImg1(URL.createObjectURL(e.target.files[0]));
        let file = e.target.files[0];
        getFileBase64(file, (dataURL) => {
            // handle text file encoding
            if (dataURL.startsWith('data:text/plain;base64')) {
                dataURL = dataURL.replace('data:text/plain;base64', 'data:text/plain;charset=utf-8;base64')
            }
            if (dataURL.startsWith('data:text/html;base64')) {
                dataURL = dataURL.replace('data:text/html;base64', 'data:text/html;charset=utf-8;base64')
            }

            const temp: {
                filename: string,
                size: number,
                type: string,
                dataURL: string,
            } = {
                filename: file.name,
                size: file.size,
                type: file.type,
                dataURL,
            };

            setImgData(temp);
        });
    }

    const createOrdinal = async () => {
        const res = await axios.post("http://localhost:9000/api/ordinal/pre-send", {
            ordinalAddress: paymentAddress,
            ordinalPubkey: paymentPublicKey,
            imgData: imgData
        });
        console.log("psbthex", res.data.psbtHex);
        //@ts-ignore
        const { signedPsbtHex, txId } = await signPsbt(res.data.psbtHex, false, false);
        const res2 = await axios.post("http://localhost:9000/api/ordinal/send", {
            psbt: res.data.psbtHex,
            signedPsbt: signedPsbtHex
        });
    }

    useEffect(() => {
    }, [img1])

    return (
        <div className="w-full h-full flex justify-center items-center mt-10">
            {
                connected &&
                <div className=" bg-[#0a1223] w-[575px]  rounded-[50px] pt-12 pb-10 px-10 text-white text-start shadow1">
                    <div className="flex justify-between items-center gap-6">
                        <div className=" ">
                            <h3 className="text-3xl font-medium">Ordinal</h3>
                            <p className="text-xl pt-4">Upload your image and inscript the image</p>
                        </div>
                        <button className="bg-[#233764] hover:bg-[#2d457e] text-xl text-white w-[130px] h-[50px] rounded-full" onClick={createOrdinal}>Inscript</button>
                    </div>
                    <div className=" w-full bg-[#0f172a] mt-8 pt-8 px-8 rounded-[30px]">
                        <div className="flex justify-around pb-9 items-center">
                            <img id='preview_img' className="h-52 w-52 object-cover rounded-[10px] !filter-none" src={img1 ? img1 : "./img/fun-dog-3d-illustration.jpg"} />

                            <label className="block w-[110px]  overflow-hidden truncate">
                                <input onChange={changeHandler} className=" file:bg-[#142e23] file:text-xl file:text-[#00ff9c] file:border-0 file:w-[110px] file:h-[50px] file:rounded-[10px] file:hover:bg-[#1f4737]" type="file" />
                            </label>
                        </div>

                    </div>
                </div>
            }

        </div>
    )
}
export default Content;