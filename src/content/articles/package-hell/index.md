---
title: "Package Hell"
date: "2026-11-19"
description: "Installer des paquets était trop simple."
categories:
  - ""
#image: "./img/"
draft: "true"
---

Tout développeur et utilisateur avancé de systèmes le sait, installer des packages est une chose "aisée". Il suffit la plupart du temps de se rendre sur la plateforme d'hébergement de notre choix et de rechercher le package qui correspond à notre besoin.
Ou simplement de laisser un LLM nous le suggérer, après tout, qui crée encore du code en 2026 ?

Cependant, tout comme il est facile de les installer, il est tout autant facile de les backdorer. Je vous propose de voir cela au travers de quelques exemples sur les langages les plus connus.

## npm install script hell

Premier candidat, npm. Souvent raillé pour la quantité de packages qui sont téléchargé via `npm install` Javascript n'en est pas moins qu'un des langages les plus populaires en terme de développement Web.
Son gestionnaire de packages principal est `npm`. Et la documentation de npm est plutot explicite.

<image npm>

Mettons ceci en pratique. Premiere étape, créer un package.json :

```sh
npm init
This utility will walk you through creating a package.json file.
It only covers the most common items, and tries to guess sensible defaults.

See `npm help init` for definitive documentation on these fields and exactly what they do.

Use `npm install <pkg>` afterwards to install a package and save it as a dependency in the package.json file.

Press ^C at any time to quit.
package name: (node) mysuperpackage
version: (1.0.0)
description: pwnie package
entry point: (index.js)
test command:
git repository:
keywords:
author: shoxxdj
license:
type: (commonjs)
About to write to /tmp/node/package.json:

{
  "name": "mysuperpackage",
  "version": "1.0.0",
  "description": "pwnie package",
  "main": "index.js",
  "scripts": {
    "test": "echo \"Error: no test specified\" && exit 1"
  },
  "author": "shoxxdj",
  "type": "commonjs"
}


Is this OK? (yes)
```

Nous obtenons ainsi un package.json minimal.
La prochaine étape, consiste à mettre en place un script d'installation. Pour cela, nous pouvons ajouter une clef "install" dans les scripts.

Il est égallement possible d'utiliser `preinstall` ou `postinstall`. Comme le précise la documentation de npmjs, tout script avec le préfix `pre<script>` sera executé avant celui-ci. Si cela n'est pas clair, le schéma suivant peut aider :

Mettons alors ceci en place :

```json
cat package.json
{
  "name": "mysuperpackage",
  "version": "1.0.0",
  "description": "pwnie package",
  "author": "shoxxdj",
  "type": "commonjs",
  "main": "index.js",
  "scripts": {
    "test": "echo \"Error: no test specified\" && exit 1",
    "install":"node scripts/ins.js",
    "preinstall":"node scripts/pre.js"
  }
}
```

Dans scripts/ins.js :

```js
console.log("install");
```

Puis dans le dossier scripts/pre.js :

```js
console.log("pre install");
```

Enfin, lancons l'installation :

```sh
npm i
npm notice run mysuperpackage@1.0.0 preinstall
npm notice run node scripts/pre.js
pre install
npm notice run mysuperpackage@1.0.0 install
npm notice run node scripts/ins.js
install

up to date, audited 1 package in 268ms

found 0 vulnerabilities
```

Notre "hello" est bien affiché, les scripts `install` et `preinstall` ont bien été éxecutés. Un dernier exemple pour explorer les possibilités offertes par ce mécanisme :

```js
const { exec } = require("child_process");
const orginalLog = console.log;
console.log = function (...args) {
  orginalLog("[PRE]", ...args);
};

console.log("Running evil script");
exec("ls -la", (err, stdout, stderr) => {
  console.log(stdout);
});
```

Et la suite ? Si nous tentons de publier un tel package sur npmjs la sortie est explicite :

```sh
npm publish
npm notice
npm notice 📦  demo-package@1.0.0
npm notice Tarball Contents
npm notice 318B demo-package-1.0.0.tgz
npm notice 343B package.json
npm notice 136B scripts/post.js
npm notice 238B scripts/pre.js
npm notice 318B victim/demo-package-1.0.0.tgz
npm notice 375B victim/node_modules/.package-lock.json
npm notice 141B victim/node_modules/demo-package/package.json
npm notice 123B victim/node_modules/demo-package/scripts/post.js
npm notice 122B victim/node_modules/demo-package/scripts/pre.js
npm notice 528B victim/package-lock.json
npm notice 330B victim/package.json
npm notice Tarball Details
npm notice name: demo-package
npm notice version: 1.0.0
npm notice filename: demo-package-1.0.0.tgz
npm notice package size: 1.4 kB
npm notice unpacked size: 3.0 kB
npm notice shasum: bc4b91dd59b964c434727e4e18ad09a6200b6355
npm notice integrity: sha512-b9c7A96nV3Hx4[...]OrNBYnP9ZpJWA==
npm notice total files: 11
npm notice
```

Le package se retrouve alors publié sur npmjs avec ses scripts. La prochaine étape consiste à backdorer un package populaire, ou à exploiter un mécanisme de dependency confusion afin de diffuser ce contenu malveillant.

## Rust

Rust dispose de nombreux mécanismes interessants pour mettre en place une attaque sur les packages. Le gestionnaire de package est ici `Cargo`. Celui-ci n'embarque pas de mécanisme `pre` ou `post` comme Javascript. Cependant, une premiere piste à explorer est le fichier `build.rs`.

### Build.rs

Créons un package rust "simple" :

```toml
[package]
name = "package"
version = "0.1.0"
edition = "2024"
build = "build.rs"
[dependencies]
```

Ici nous spécifions que le mécanisme de construction du package doit se faire en passant par le `build.rs`.
Dans `src/main.rs` nous pouvons ajouter un contenu minimal pour que Rust accepte de compiler :

```rust
fn main() {
    println!("Hello, world!");
}
```

Enfin dans `build.rs` nous pouvons placer notre code malveillant :

```rust
use std::{env, fs};

fn main() {
    // Visible pendant cargo install (stdout est sinon capturé)
    println!("cargo:warning=build.rs exécuté !");
    println!("cargo:warning=DOING EVIL STUFF WHILE BUILDING");
    // Preuve d'exécution, avec les droits de l'utilisateur

    let user = env::var("USER").unwrap_or_default();
    let target = env::var("TARGET").unwrap_or_default();

    fs::write("/tmp/demo-hook.txt", format!("exécuté par {user} pour {target}\n")).unwrap();
    println!("DEMO FILE WRITEN IN /tmp/demo-hook.txt");
    // si build.rs change on relance :
    println!("cargo:rerun-if-changed=build.rs");
}

```

Compilons !

```sh
cargo build
   Compiling package v0.1.0 (/home/shoxx/Documents/Lab/attack-on-ci/rust/basic-build-hook)
warning: package@0.1.0: build.rs exécuté !
warning: package@0.1.0: DOING EVIL STUFF WHILE BUILDING
    Finished `dev` profile [unoptimized + debuginfo] target(s) in 0.21s

```

Notre code s'execute, et `/tmp/demo-hook.txt` contient bien les éléments attendus.

### Proc-Macro

Ce qui est certain c'est que placer toute sa backdoor dans un fichier `build.rs` peut être dangereux. Un mécanisme de sécurité avisé sera capable de prévenir l'utilisateur qu'un tel fichier existe et qu'il faut faire attention (pourquoi cela n'est pas le cas alors ? aucune idée.)

Il existe à minima une autre technique pour empoisonner un package Rust, les Proc-Macro.

Une proc-macro c'est un mécanisme qui permet à Rust de modifier le code à la compilation.

Créons une premiere application "demo" :

```sh
demo-app
├── Cargo.toml
└── src
    └── main.rs
```

Avec Cargo.toml :

```toml
[package]
name = "demo-app"
version = "0.1.0"
edition = "2021"

[dependencies]
demo-macro = { path = "../demo-macro" }
```

et src/main.rs :

```sh
fn main() {
    demo_macro::hello!();
}
```

Cette application se base sur une libraire qui sera présente dans demo-macro. Celle-ci prends la meme forme que précédement :

```sh
demo-macro
├── Cargo.toml
└── src
    └── lib.rs
```

Avec Cargo.toml

```toml
[package]
name = "demo-macro"
version = "0.1.0"
edition = "2021"

[lib]
proc-macro = true
```

et dans src/lib.rs :

```sh
#[proc_macro]
pub fn hello(input: TokenStream) -> TokenStream {
    eprintln!("proc-macro exécutée !");
    input
    //Reste du code malveillant
}
```

Compilons à présent :

```sh
cargo build
   Compiling demo-macro v0.1.0 (./rust/proc-macro/demo-macro)
   Compiling demo-app v0.1.0 (./rust/proc-macro/demo-app)
proc-macro exécutée !
    Finished `dev` profile [unoptimized + debuginfo] target(s) in 0.63s
```

Le code de notre macro est executé !

### Cargo install

Ce que j'aime particulièrement chez Rust, c'est cette possibilité de compiler des binaires et de les installer très rapidement. Récement j'ai découvert que cela permettais par exemple sur un serveur Git sur lequel le Cargo.lock est présent d'installer des binaires très simplement :

```sh
cargo install --git http://github.com/shoxxdj/git-tools-rs
```

Et oui, les `build.rs` et les `proc-macro` fonctionnent avec cette méthode d'installation.

## Python

Python n'échappe pas à ce type d'attaques. Il y a une méthode "classique" qui consiste à intégrer le code malveillant dans setup.py :

```python
from setuptools import setup
import os
import pathlib

# Code exécuté lors du chargement de setup.py
print("[+] setup.py executed")

pathlib.Path("/tmp/setup-executed").write_text("Executed!")

setup(
    name="example-package",
    version="1.0.0",
    packages=["example"],
)
```

```sh
python setup.py setup
```

<todo>

Ceci peut égallement être fait avec une modification du fichier `pyproject.toml` et nottament la clef `build-backend`.

```toml
[build-system]
requires = []
build-backend = "evil"
backend-path = ["."]
```

Dans ce cas, notre fichier `evil.py` doit contenir les éléments attendus pour la génération d'un package :

```sh
pip install -v .
Using pip 26.2.2 from venv/lib/python3.14/site-packages/pip (python 3.14)
Processing ./.
  Running command Getting requirements to build wheel
  Getting requirements to build wheel ... done
  Running command Preparing metadata (pyproject.toml)
  [+] EVIL CODE EXECUTED!
  Preparing metadata (pyproject.toml) ... done
Building wheels for collected packages: pip-install-poc
```
