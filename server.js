const express = require("express");
const multer = require("multer");
const fetch = require("node-fetch");
const cors = require("cors");
require("dotenv").config();

const app = express();
const upload = multer({ limits: { fileSize: 50 * 1024 * 1024 } });

app.use(cors());
app.use(express.static("public"));

app.post(
  "/upload",
  upload.fields([
    { name: "stl_superior", maxCount: 1 },
    { name: "stl_inferior", maxCount: 1 }
  ]),
  async (req, res) => {
    try {
      const files = req.files;
      const data = req.body;

      if (!files.stl_superior || !files.stl_inferior) {
        return res.status(400).send("Arquivos STL obrigatórios.");
      }

      const uploadToDropbox = async (file, name) => {
        const response = await fetch("https://content.dropboxapi.com/2/files/upload", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${process.env.DROPBOX_TOKEN}`,
            "Dropbox-API-Arg": JSON.stringify({
              path: `/refinamentos/${Date.now()}_${name}`,
              mode: "add",
              autorename: true
            }),
            "Content-Type": "application/octet-stream"
          },
          body: file.buffer
        });

        if (!response.ok) {
          throw new Error("Erro ao enviar para o Dropbox");
        }
      };

      await uploadToDropbox(files.stl_superior[0], "superior.stl");
      await uploadToDropbox(files.stl_inferior[0], "inferior.stl");

      console.log("Novo caso recebido:", data);

      res.send("Caso enviado com sucesso!");
    } catch (err) {
      console.error(err);
      res.status(500).send("Erro no envio.");
    }
  }
);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Servidor rodando na porta", PORT));
