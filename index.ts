// access file
import axios from "axios";
import { mkdir, writeFile, access, readdir } from "fs/promises";
import { constants } from "fs";

const baseUrl = "https://sirekap-obj-data.kpu.go.id/wilayah/pemilu/ppwp/";
const baseUrlc1 = "https://sirekap-obj-data.kpu.go.id/pemilu/hhcw/pdpr/";

const provinsiId = "33";
const kabupatenId = "3308";
const kabupaten = "Magelang";

// make folder for kabupaten
await mkdir(`${kabupaten}`, { recursive: true });

const fileKec = Bun.file(`${kabupatenId}.json`);
const textKec = await fileKec.text();
const jsonKec = JSON.parse(textKec);

// loop through kecamatan
for (const kec of jsonKec) {
    // make folder for kecamatan
    await mkdir(`${kabupaten}/${kec.nama}`, { recursive: true });

    // fetch data kelurahan from server
    const res = await axios.get(`${baseUrl}${provinsiId}/${kabupatenId}/${kec.kode}.json`);
    const dataKel = res.data;

    // make folder for kelurahan
    for (const kel of dataKel) {
        await mkdir(`${kabupaten}/${kec.nama}/${kel.nama}`, { recursive: true });

        const resTps = await axios.get(`${baseUrl}${provinsiId}/${kabupatenId}/${kec.kode}/${kel.kode}.json`);
        const dataTps = resTps.data;

        // skip if tps is empty
        if (dataTps === null) continue;
        if (dataTps.length === 0) continue;

        for (const tps of dataTps) {
            await mkdir(`${kabupaten}/${kec.nama}/${kel.nama}/${tps.nama}`, { recursive: true });

            const resc1 = await axios.get(`${baseUrlc1}${provinsiId}/${kabupatenId}/${kec.kode}/${kel.kode}/${tps.kode}.json`);
            const dataC1 = resc1.data;

            const dataC1Image = dataC1.images;

            if (dataC1Image === null) continue;
            if (dataC1Image.length === 0) continue;

            // get length of image already exist
            const imgExist = await readdir(`${kabupaten}/${kec.nama}/${kel.nama}/${tps.nama}`);
            const imgExistLength = imgExist.length;

            if (dataC1Image.length === imgExistLength) {
                console.log(`SKIP: ${kabupaten} - ${kec.nama} - ${kel.nama} - ${tps.nama}`);
                continue;
            }

            console.log(`GET C1 ${kabupaten} - ${kec.nama} - ${kel.nama} - ${tps.nama}`);

            for (const imgUrl of dataC1Image) {
                if (imgUrl === null) continue;
                if (imgUrl === "") continue;
                const resImg = await axios.get(imgUrl, { responseType: "arraybuffer" });
                const imgBuffer = Buffer.from(resImg.data);

                const imgName = imgUrl.split("/").pop();
                const imgPath = `${kabupaten}/${kec.nama}/${kel.nama}/${tps.nama}/${imgName}`;

                try {
                    await access(`${imgPath}`, constants.F_OK);
                    console.log(`SKIP: ${imgPath}`);
                    continue;
                } catch (error) {

                    console.log(`SAVE: ${imgPath}`);
                }

                writeFile(`${imgPath}`, imgBuffer);
            }
        }
    }
}