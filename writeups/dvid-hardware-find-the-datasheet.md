---
title: "DVID - Hardware - Find the Datasheet"
date: "2019-07-10"
categories:
  - "iot"
  - "writeups"
image: "/medias/writeups/dvid-hardware-find-the-datasheet/1_cDY8QwW_IRNuZl5xuJJqbA.png"
---

Dvid est un projet créé par [@Vulcainreo](https://twitter.com/Vulcainreo) afin de faciliter l’apprentissage des attaques sur des devices IOT. Concrètement c'est un package vendu pour ~30€ comprenant une board, des modules ( bluetooth ect ) et des outils d'attaques ( pour la version complète ). Voyons ensemble le writeup de la première épreuve !

### Installation

Tout d'abord, partons du principe que vous avez commandé et reçu le package comprenant les outils d'attaques. La fin de l'article comporte également une partie avec le [bus pirate](http://dangerousprototypes.com/docs/Bus_Pirate).

#### Chargement du module

Commençons par récupérer les fichiers du projet et plaçons nous dans le répertoire du challenge :

```
git clone https://github.com/Vulcainreo/DVID.git cd DVID/training/hardware/findTheDatasheet
```

Le challenge ne nécessite pas de modules spécifiques, nous pouvons directement le flasher sur la carte. Pour cela nous utilisons _avrdude_ (installez le si nécessaire) ainsi que le dongle usb AVR programmer

```
sudo avrdude -c usbasp -p m328p -U flash:w:findTheDatasheet.ino.arduino_standard.hex
```

![Flash de la carte](/medias/writeups/dvid-hardware-find-the-datasheet/IMG_20190710_145338-1024x576.jpg)

### Challenge

Pour résoudre le challenge j'utilise le dongle USB to TTL pour alimenter la carte. Celle ci supporte le 5v et le dongle permet de sortir du 5V.

L'écran nous indique : "Connect RX to the PD1 pin to get the password"

Cherchons tout d'abord à traduire cette phrase. Comme certains le savent je pratique le FPV, par ce biais j'ai appris que RX était un terme utilisé pour récepteur. Un peu plus de [recherches](https://learn.sparkfun.com/tutorials/serial-communication/all) nous permettent de savoir que RX/TX sont des récepteurs/émetteurs séries. Ainsi une version simplifié de la phrase donnerais :

"Connectez un récepteur série sur le pin PD1 pour obtenir le password"

#### Trouver le pin PD1

Première étape, trouver ce fameux pin. Si vous soulevez l'écran vous pourrez voir la référence de la puce utilisée par la board, il s'agit d'une ATMega328p. Une rapide recherche google nous permet d'obtenir les noms des pins :

![Résultat de recherche d'images pour "pd1 atmega 328p"](/medias/writeups/dvid-hardware-find-the-datasheet/ATMega328P-Pinout.png)

Le pin PD1 correspond à un emmeteur (TX). Peu étonnant RX et TX sont très souvent associé pour effectuer des communications.

Nous pourrions alors simplement connecter un jumper sur le pin de l'ATMega328p et le relier à un récepteur série. Ce serait possible ici car la puce est accessible physiquement. Mais ce n'est pas le but du challenge.

Dans le repertoire git, se trouve des Gerber Files. Ces fichiers sont utilisés pour concevoir des circuits électroniques. Ouvrons les dans l'utilitaire gerbv :

![Gerber File](/medias/writeups/dvid-hardware-find-the-datasheet/image-1024x762.png)

Nous pouvons ici suivre le lien entre le pin PD1 de l'ATMega et le pin TX de la board.

#### Lecture du flag

Au début de ce writeup j'ai décidé d'utiliser le lecteur série USB "un peu par hasard" afin d'alimenter la board en 5V. A l'avenir j'essayerais d'utiliser un composant externe. Nous savons ou connecter les cables ( TX de la board, RX du dongle USB ) il ne nous reste plus qu'à lire le password en écoutant le sur le port serie RX.

Cela peut être fait grâce à ce script python permettant d’interagir avec le lecteur USB.

```
import serial
port = '/dev/ttyUSB0' rate = 9600
ser = serial.Serial(port,rate) read = ser.readline().decode('utf-8') print(read)
```

J'utilise ici la librairie pyserial, le port peut être déterminé en utilisant les logs dmseg.

```
dmesg| grep tty
✘ usb 1-4: cp210x converter now attached to ttyUSB0
```

![A la demande de l'auteur, le flag est volontairement caché](/medias/writeups/dvid-hardware-find-the-datasheet/image-1.png)

### Résolution avec un bus pirate v4

Cette carte traînait dans mon tiroir depuis quelques temps et je cherchais une occasion d'apprendre à l'utiliser (merci DVID ! ).

Pour résoudre ce challenge, vous avez besoin d'un bus pirate capable de lire des données en UART. Si ce n'est pas le cas, c'est surement que votre Bus pirate n'est pas à jour.

#### Flash de la carte

Assurez vous de relier les ports PGC et PGD via un jumper puis :

```
git clone https://github.com/BusPirate/Bus\_Pirate.git cd Bus_Pirate/package/BPv4-firmware/pirate-loader-v4-source/pirate-loader\_lnx sudo ./pirate-loader\_lnx --dev=/dev/ttyACM0 --hex=../BPv4-firmware-v6.3-r2151.hex
```

Votre bus pirate doit maintenant être flashé et pret à lire des infos via UART.

#### Reception du flag

Tout d'abord, branchons le bus pirate et connectons nous :

```
sudo gtkterm -s 115200 -p /dev/ttyACM0
```

Pour les branchements des pins, la partie 5V/GND est assez simple. Cependant contrairement au dongle USB to TTL le bus pirate n'a pas de port RX explicitement décris. Une [rapide recherche](http://dangerousprototypes.com/blog/bus-pirate-manual/bus-pirate-uart-guide/) nous indique qu'il s'agit du port MISO.

Entrons dans la console du bus pirate.

![](/medias/writeups/dvid-hardware-find-the-datasheet/image-2.png)

Je ne vais pas expliciter la configuration du lecteur, cette partie est assez intuitive. Une fois la configuration faite il n'y a plus qu'a alimenter la carte avec la commande _W_. L'écran de la board s'allume. On peut à présent lire les données via le bus RX à l'aide de la commande _{_. Nous obtenons alors les différents caractères du password sous forme hexadécimale :

![Lecture du flag par le bus pirate](/medias/writeups/dvid-hardware-find-the-datasheet/image-3.png)

## Conclusion

And voila ! Ce premier niveau de DVID permet de nous lancer facilement dans l'étude des protocoles IOT et hardware. Le projet est vraiment chouette, une communauté commence à se former sur le discord dédié et les possibilités d'évolutions sont très intéressantes. N'hésitez pas à vous lancer !
