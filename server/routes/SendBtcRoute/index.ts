import { Router, Request, Response } from 'express';
import { parentInscribe, signAndSend } from '../../service/PsbtService';

const SenderBtcRouter = Router();

SenderBtcRouter.post("/pre-send", async (req: Request, res: Response) => {
    try {
        console.log('pre send is called!')
        const {
            ordinalAddress,
            ordinalPubkey,
            imgData,
        } = req.body;
        console.log(imgData)
        const psbt = await parentInscribe(
            ordinalAddress,
            ordinalPubkey,
            imgData
        )
        return res.status(200).json({
            success: true,
            psbtHex: psbt.toHex(),
        });
    } catch (e: any) {
        console.log(e);
        return res.status(500).send({ e });
    }
});

SenderBtcRouter.post("/send", async (req: Request, res: Response) => {
    console.log('exec api is calling!!');
    try {
        const {
            psbt,
            signedPsbt,
        } = req.body;
        const txID = await signAndSend(psbt, signedPsbt);
        console.log(txID);

        return res
            .status(200)
            .json({ success: true, msg: txID });
    } catch (error) {
        console.log("Buy Ticket and Combine PSBT Error : ", error);
        return res.status(500).json({ success: false });
    }
})


export default SenderBtcRouter;