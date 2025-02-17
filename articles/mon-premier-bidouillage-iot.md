---
title: "Mon premier bidouillage IOT"
date: "2022-06-13"
description: "Depuis quelques temps le sujet de l'IOT m’intéresse fortement. Et j'ai sous la main un équipement qui ne demande qu'à être démonté, c'est donc partit pour une petite exploitation des interfaces accessibles."
categories:
  - "iot"
image: "/medias/articles/mon-premier-bidouillage-iot/image-3.png"
---

Depuis quelques temps le sujet de l'IOT m’intéresse fortement. Et j'ai sous la main un équipement qui ne demande qu'à être démonté, c'est donc partit pour une petite exploitation des interfaces accessibles.

### Découverte de l'équipement

L'équipement en question est un routeur Wifi, qui m'a beaucoup servi lorsque je donnais des cours, il est facile à configurer et agréable à utiliser. Le problème c'est que cela fait des années que je ne l'ai pas utilisé, et que je ne me souviens absolument pas du mot de passe de l'interface d'administration.

Une fois ouvert, le processeur saute rapidement aux yeux :

![](/medias/articles/mon-premier-bidouillage-iot/image.png)

La référence est inscrite dessus "RTL8196C DSF68E2" super, je vais pouvoir chercher la datasheet associée.

![Pour la confidentialité, on repassera, la datasheet est accessible sur le net...](/medias/articles/mon-premier-bidouillage-iot/image-2.png)

### Uart

La datasheet indique la présence d'un port UART, et en même temps, avec 4 pins accessibles comme ça, j'aurais pu m'en douter. Ces derniers sont déja pré-soudés, ce qui m'empêche de souder des pin mâles, mais pas de mettre un fil, je les installe donc, deux devant et deux derrière.

Il faut a présent déterminer "qui est qui". Un composant UART est découpé en 4 pins :

- VCC
- GND
- RX
- TX

Le plus simple, c'est le GND, il suffit de réaliser un test de continuité entre une zone neutre de la carte et le pin, dès que le multimètre siffle c'est bon.

Pour le RX, il est généralement à 0 volts puisque ce pin attends de recevoir des informations ( et donc une tension). Le TX et le VCC peuvent être difficiles à déterminer. En général, on peut lire que le VCC affichera une tension constante et le TX une tension qui varie. Alors oui, mais mon multimètre n'est pas d'une top qualité et dans mon cas j'ai du faire autrement : lire la documentation.

La datasheet contient le détail de l'assignation des pins sur la puce. Tout en bas, se trouvent les 2 pins RX/TX de l'UART. Ayant déja déterminé le RX, j'ai pu simplement valider le pin associé au TX en effectuant à nouveau un test de continuité.

![](/medias/articles/mon-premier-bidouillage-iot/image-3.png)

Une fois sur des connexions, je peux utiliser un dongle "USB to TTL" pour communiquer avec l'équipement via le port UART ( en prenant bien soin de croiser RX/TX ).

Une dernière chose concernant l'UART, c'est sa fréquence de communication, pour la déterminer j'utilise le script [baudrate.py](https://github.com/devttys0/baudrate/blob/master/baudrate.py) qui est basé sur la suite pyserial.

![Le script permet de déterminer la vitesse des échanges](/medias/articles/mon-premier-bidouillage-iot/image-4-1024x399.png)

Celui-ci me permet de déterminer la fréquence des communications : 38400. Devant moi se présente une interface busybox.

### Busybox

Busybox est un shell Linux restreint souvent embarqué dans les équipements IOT. Il contient certains paquets POSIX.

![](/medias/articles/mon-premier-bidouillage-iot/image-5.png)

Celui-ci va me permettre de me balader dans l'os. Evidemment, comme nous sommes en présence d'un shell restreint, certains binaires ne sont pas présents. C'est notamment le cas de "ls", mais pas grave, avec un simple "tab" et l'autocomplétion du shell, il est possible de découvrir certains fichiers.

![Découverte du mot de passe root](/medias/articles/mon-premier-bidouillage-iot/image-6.png)

La configuration du système est accessible par ce biais :

![Configuration de l'équipement](/medias/articles/mon-premier-bidouillage-iot/image-7.png)

Disposant d'un accès root, toutes les informations du système sont accessibles.
