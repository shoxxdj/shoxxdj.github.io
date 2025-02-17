---
title: "DVID - Firmware - DefaultPassword"
date: "2019-07-28"
categories:
  - "iot"
  - "writeups"
image: "/medias/writeups/dvid-firmware-defaultpassword/hacker-selling-hacked-iot-botnet-for-massive-ddos-attacks-main.jpg"
---

Suite de la résolution des [challenges DVID](https://shoxxdj.fr/dvid-hardware-find-the-datasheet/) avec cette fois ci le premier challenge de la catégorie Firmware.

### Découverte du challenge

Commençons tout d'abord par charger le code dans la board :

```
sudo avrdude -c usbasp -p m328p -U flash:w:defaultPassword.ino.arduino_standard.hex
```

Le readme nous indique que la board attend un mot de passe en entrée (RX), si celui ci est valide un message secret est révélé. Sinon c'est un message d'erreur. Bonus, la board envoie le message directement via sa sortie ( TX ).

Nous allons donc devoir lancer une attaque brute force via le port série (RX de la board). Pour cela j'utiliserais le module USB to TTL.

### Résolution

[Contrairement au premier challenge](https://shoxxdj.fr/writeups/dvid-hardware-find-the-datasheet/), il n'existe pas beaucoup d'inconnues dans celui-ci. Nous savons déjà comment communiquer avec la board via le module USB to TTL et ou se brancher sur celle-ci. Passons donc au script de résolution :

```
import serial import time
port = '/dev/ttyUSB0' rate = 9600
ser = serial.Serial(port,rate) oldval=""
with open('./dict') as dictionnaire:
  for password in dictionnaire:
    print("Trying : %s"%(password))
    write = ser.write(password.strip().encode('utf-8'))
    read = ser.readline().decode('utf-8')
    print(read)
    if 'ok' in read:
        print("Correct password %s"%(oldval))
        break
    else:
        oldval=password
        time.sleep(2)
```

Un peu d'explications. Ce script est une version "simple" d'un brute force. Une entrée est lue dans un fichier dictionnaire et est envoyée via le port série. Puis la valeur envoyée par la board est lue. A ce moment j'ai repéré un petit bug du script que je n'arrive pas vraiment à expliquer même en lisant le code source de l'épreuve. En effet, si le bon mot de passe est envoyé, un message "ko" est retourné, puis à la prochaine soumission peu importe la valeur le message "ok" est renvoyé. Il faut donc stocker la valeur précédente à chaque message d'erreur ( ligne 20 ).

And voila ! Enfin, voila pour la méthode simple. Lors de ma première résolution du challenge le fichier dictionnaire n'était pas fourni. J'ai donc utilisé une autre méthode.

### Autre méthode de résolution

Comme je ne disposais pas du dictionnaire, et que le mot de passe ne se trouve pas dans un dictionnaire comme rockyou, j'ai du trouver une autre méthode : Dumper le firmware et le reverser. Ce n'est clairement pas la méthode de résolution attendue. Mais a défaut de dictionnaire il faut pouvoir s'adapter.

#### Dump du firmware

Pour dumper le firmware je vais utiliser l'utilitaire avrdude ainsi que le câble approprié.

```
sudo avrdude -c usbasp -p m328p -F -U flash:r:dump.hex:i
```

Le fichier dump.hex contient des informations totalement incompréhensibles pour un humain.

```
cat dump.hex :200000000C9447050C946F050C946F050C946F050C946F050C946F050C946F050C946F0568 :200020000C946F050C946F050C946F050C946F050C946F050C946F050C946F050C946F0520 :200040000C949C100C946F050C94110D0C94EB0C0C946F050C946F050C946F050C946F059B :200060000C940B0E0C946F05DB40A4A62EAFDA0281DA1281DA02818F2000A1C8D300408D92 :20008000AED580A80000600000000000000000000000000000E00000000000000000000075 :2000A00000000001E00000000000000000000000000001F00000000000000000000000006E :2000C0000003F00000000000000000000000000007F000000000000000000000000000072F :2000E000F8000000000000000000000000000FF800000003C0007E000001E0007F0FF80059 :20010000000003C000FE000001E000FFEFF800000003C000FE000001E000FFFFF8000000BF ....
```

Pour pouvoir analyser ce dump, il faut le convertir, cela peut être fait via l'utilitaire avr-objcopy.

```
avr-objcopy -I ihex -O elf32-avr dump.hex dump.elf
```

Nous obtenons à ce moment un fichier dump.elf de type binaire 32bits.

#### Analyse du dump

Je ne pense pas que l'on puisse parler d'analyse à proprement parler, puisqu'il suffit d'utiliser l'outil préféré des _reversers_ : strings. Celui ci nous permet d'obtenir la liste des chaines de caractères du binaire. Il arrive assez souvent que le mot de passe soit codé directement en dur dans le binaire. Une fois cette liste extraite, je l'utilise en tant que dictionnaire pour le script situé plus haut.
