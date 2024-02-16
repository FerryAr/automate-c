// access file
import axios from "axios";
import { mkdir, writeFile, access } from "fs/promises";
import { constants } from "fs";

const baseUrl = "https://sirekap-obj-data.kpu.go.id/wilayah/pemilu/ppwp/";
const baseUrlc1 = "https://sirekap-obj-data.kpu.go.id/pemilu/hhcw/pdpr/";

const provinsiId = "33";
const kabupatenId = "3306";
const kabupaten = "Purworejo";

// make folder for kabupaten
await mkdir(`${kabupaten}`, { recursive: true });

const fileKec = Bun.file(`${kabupatenId}.json`);
const textKec = await fileKec.text();
const jsonKec = JSON.parse(textKec);


// loop through kecamatan
for (const kec of jsonKec) {
    // make folder for kecamatan
    await mkdir(`${kabupaten}/${kec.nama}`, { recursive: true });

    console.log(kec.nama);

    // fetch data kelurahan from server then save to file using axios
    const res = await axios.get(`${baseUrl}${provinsiId}/${kabupatenId}/${kec.kode}.json`);
    const dataKel = res.data;

    // make folder for kelurahan
    for (const kel of dataKel) {
        await mkdir(`${kabupaten}/${kec.nama}/${kel.nama}`, { recursive: true });

        const resTps = await axios.get(`${baseUrl}${provinsiId}/${kabupatenId}/${kec.kode}/${kel.kode}.json`);
        const dataTps = resTps.data;

        for (const tps of dataTps) {
            // make folder for tps

            console.log(`GET C1 ${kabupaten} - ${kec.nama} - ${kel.nama} - ${tps.nama}`);
            await mkdir(`${kabupaten}/${kec.nama}/${kel.nama}/${tps.nama}`, { recursive: true });

            const resc1 = await axios.get(`${baseUrlc1}${provinsiId}/${kabupatenId}/${kec.kode}/${kel.kode}/${tps.kode}.json`);
            const dataC1 = resc1.data;

            const dataC1Image = dataC1.images;
            for (const imgUrl of dataC1Image) {
                if (imgUrl === null) continue;
                if (imgUrl === "") continue;
                const resImg = await axios.get(imgUrl, { responseType: "arraybuffer" });
                const imgBuffer = Buffer.from(resImg.data);

                const imgName = imgUrl.split("/").pop();
                const imgPath = `${kabupaten}/${kec.nama}/${kel.nama}/${tps.nama}/${imgName}`;

                // if image already exist, skip

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