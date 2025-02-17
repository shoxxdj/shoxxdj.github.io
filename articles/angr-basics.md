---
title: "Angr - Basics"

date: "2019-10-03"
description: "L'ingénierie inversée de binaires peut être une opération délicate. Il arrive assez souvent en challenges ou CTF que les fonctions de vérifications soient volontairement complexes. Heureusement des outils sont disponibles pour nous aider, aujourd'hui intéressons nous à Angr."
categories:
  - "reverse-engineering"
  - "tutos"
image: "/medias/articles/angr-basics/625456_0b23_2.jpg"
---

Si on en crois les propos reportés régulièrement lors du SSTIC, les outils de reverse engineering ( RE ) ont une durée de vie très faible, chaque "reverser" préférant coder son propre outil plutôt qu'améliorer les précédents. Difficile alors de prévoir la durée de vie d'un outil. Personnellement je n'ai pas encore la prétention de me plaindre des fonctionnalités d'un outil, je préfère composer avec plusieurs d'entre eux.

Angr est un outil qui peut être utilisé pour pas mal de tâches. Nous allons aujourd'hui voir comment utiliser ses fonctionnalités de solveur de contrainte.

### L'apprentissage par l'exemple

Comme un bon exemple vaut mieux qu'un long discours je vous propose de passer directement à la partie pratique.

Considérons le code suivant, l'objectif est de faire afficher au binaire la sortie "win". Pour cela, à la lecture du code nous constatons qu'il suffit de rentrer la chaine "yeah" en argument (argv\[1\]).

```
#include <stdio.h>
#include <string.h>
int main(int argc, char * argv[])
{
  if (strcmp(argv[1], "yeah") == 0)
   {
    printf("win");
   }
   else
   {
     printf("fail");
   }
  return 0;
}
```

```
gcc code.c -no-pie
```

Evidemment, cet exemple est assez trivial mais suffisant pour poser les bases d'Angr. Ce qu'il est important de retenir, c'est que l'on souhaite faire exécuter la ligne 'printf("win")'. Et c'est exactement ce que l'on va demander au programme. Angr va ici être utilisé pour résoudre les contraintes permettant d’exécuter cette ligne du programme.

#### Un peu de reverse engineering

Bien sur, il ne suffit pas d'énoncer une phrase magique devant son laptop pour que cela se produise. Il va falloir configurer angr afin de lui donner les bonnes valeurs. Je vais donc utiliser r2 pour cette étape.

```
r2 a.out
a -- *(ut64*)buffer ought to be illegal
[0x00401050]&gt; aaaa
[x] Analyze all flags starting with sym. and entry0 (aa)
[x] Analyze function calls (aac)
[x] Analyze len bytes of instructions for references (aar)
[x] Check for objc references
[x] Check for vtables
[x] Type matching analysis for all functions (aaft)
[x] Propagate noreturn information
[x] Use -AA or aaaa to perform additional experimental analysis.
[x] Finding function preludes
[x] Enable constraint types analysis for variables
[0x00401050]&gt; pdf@main
/ (fcn) main 88
|   int main (int argc, char **argv, char **envp);
|           ; var char **s1 @ rbp-0x10
|           ; var int32_t var_4h @ rbp-0x4
|           ; arg int argc @ rdi
|           ; arg char **argv @ rsi
|           ; DATA XREF from entry0 @ 0x401071
|           0x00401136      55             push rbp
|           0x00401137      4889e5         mov rbp, rsp
|           0x0040113a      4883ec10       sub rsp, 0x10
|           0x0040113e      897dfc         mov dword [var_4h], edi     ; argc
|           0x00401141      488975f0       mov qword [s1], rsi         ; argv
|           0x00401145      488b45f0       mov rax, qword [s1]
|           0x00401149      4883c008       add rax, 8
|           0x0040114d      488b00         mov rax, qword [rax]
|           0x00401150      488d35ad0e00.  lea rsi, str.yeah           ; 0x402004 ; "yeah" ; const char *s2
|           0x00401157      4889c7         mov rdi, rax                ; const char *s1
|           0x0040115a      e8e1feffff     call sym.imp.strcmp         ; int strcmp(const char *s1, const char *s2)
|           0x0040115f      85c0           test eax, eax
|       ,=&lt; 0x00401161      7513           jne 0x401176
|       |   0x00401163      488d3d9f0e00.  lea rdi, [0x00402009]       ; "win" ; const char *format
|       |   0x0040116a      b800000000     mov eax, 0
|       |   0x0040116f      e8bcfeffff     call sym.imp.printf         ; int printf(const char *format)
|      ,==&lt; 0x00401174      eb11           jmp 0x401187
|      ||   ; CODE XREF from main @ 0x401161
|      |`-&gt; 0x00401176      488d3d900e00.  lea rdi, str.fail           ; 0x40200d ; "fail" ; const char *format
|      |    0x0040117d      b800000000     mov eax, 0
|      |    0x00401182      e8a9feffff     call sym.imp.printf         ; int printf(const char *format)
|      |    ; CODE XREF from main @ 0x401174
|      `--&gt; 0x00401187      b800000000     mov eax, 0
|           0x0040118c      c9             leave
\           0x0040118d      c3             ret
[0x00401050]&gt;
```

Nous voyons ici que l'adresse à la quelle nous souhaitons arriver est 0x0040116f (printf('win')). L'adresse que l'on souhaite éviter est 0x00401182. De plus, nous voyons que l'argument est attendu en paramètre "argv1". C'est ici toutes les informations nécessaires pour lancer angr.

#### Angr

Pour résoudre ce crackme, le code angr suivant peut être utilisé ( pas de soucis, je détaille chaque ligne juste après )

```
import angr
import claripy
find = 0x0040116f
avoid = 0x00401182
p = angr.Project('./a.out')
argv1 = claripy.BVS('password',8*100)
state = p.factory.entry_state(args=["./a.out",argv1])
s = p.factory.simulation_manager(state)
s.explore(find=find,avoid=avoid)

print(s.found)
found = s.found[0]

print(found.solver.eval(argv1,cast_to=bytes))
```

1 ) import de la librairie angr, je ne vois pas trop quoi expliquer sur cette étape :).

2. import de claripy. Claripy est un des nombreux sous projets développé par Angr, il s'agit du solveur de contrainte d'Angr il fonctionne un peu comme z3 dont il utilise des fonctionnalités.

3. l'adresse mémoire à la quelle on souhaite accéder.

4. l'adresse mémoire que l'on souhaite éviter.

5. création du projet Angr, a.out représente ici le nom de mon binaire.

6. création d'une contrainte Claripy. Ici, nous avons identifié que la variable argv1 était celle qui devrais contenir le pass attendu. Pour la taille j'ai fixé arbitrairement 8\*100 bits, si cette taille est trop importante le programme comblera avec des NULL. Enfin le type BVS correspond à BitVectorSymbolic puisque la valeur sera stockée au même endroit que le serait le "vrai" argv\[1\].

7. La "factory" est une méthode permettant d'initaliser un projet. La méthode entryState permet de définir les paramètres de lancements du binaire. Il serait par exemple possible de définir l'état de certains registres à l'avance ect. Ici à la manière d'un execve on passe le tableau d'arg au programme ( nottez que argv1 fait référence à notre variable claripy ).

8. Le simulation manager est un autre des composants d'angr, celui ci permet de contrôler le flot d’exécution en fonction des states définis.

9. L'utilisation de la méthode "explore" du simulation manager demande au programme de résoudre les contraintes jusqu’à ce que l'adresse indiquée en paramètre "find" soit atteinte.

11 12 et 14 ) il s'agit ici de print du résultat avec différents formatages

Maintenant que nous avons compris chaque ligne de notre programme il n'y a plus qu'a le lancer.

```
python an.py                                                                                                                                                      ✘ 2
WARNING | 2019-09-27 15:03:47,870 | angr.state_plugins.symbolic_memory | The program is accessing memory or registers with an unspecified value. This could indicate unwanted behavior.
WARNING | 2019-09-27 15:03:47,870 | angr.state_plugins.symbolic_memory | angr will cope with this by generating an unconstrained symbolic variable and continuing. You can resolve this by:
WARNING | 2019-09-27 15:03:47,870 | angr.state_plugins.symbolic_memory | 1) setting a value to the initial state
WARNING | 2019-09-27 15:03:47,870 | angr.state_plugins.symbolic_memory | 2) adding the state option ZERO_FILL_UNCONSTRAINED_{MEMORY,REGISTERS}, to make unknown regions hold null
WARNING | 2019-09-27 15:03:47,870 | angr.state_plugins.symbolic_memory | 3) adding the state option SYMBOL_FILL_UNCONSTRAINED_{MEMORY_REGISTERS}, to suppress these messages.
WARNING | 2019-09-27 15:03:47,870 | angr.state_plugins.symbolic_memory | Filling register r15 with 8 unconstrained bytes referenced from 0x401190 (__libc_csu_init+0x0 in a.out (0x401190))
WARNING | 2019-09-27 15:03:47,872 | angr.state_plugins.symbolic_memory | Filling register r14 with 8 unconstrained bytes referenced from 0x401199 (__libc_csu_init+0x9 in a.out (0x401199))
WARNING | 2019-09-27 15:03:47,873 | angr.state_plugins.symbolic_memory | Filling register r13 with 8 unconstrained bytes referenced from 0x40119e (__libc_csu_init+0xe in a.out (0x40119e))
WARNING | 2019-09-27 15:03:47,875 | angr.state_plugins.symbolic_memory | Filling register r12 with 8 unconstrained bytes referenced from 0x4011a3 (__libc_csu_init+0x13 in a.out (0x4011a3))
WARNING | 2019-09-27 15:03:47,878 | angr.state_plugins.symbolic_memory | Filling register rbx with 8 unconstrained bytes referenced from 0x4011b4 (__libc_csu_init+0x24 in a.out (0x4011b4))
WARNING | 2019-09-27 15:03:47,895 | angr.state_plugins.symbolic_memory | Filling register cc_ndep with 8 unconstrained bytes referenced from 0x4011c6 (__libc_csu_init+0x36 in a.out (0x4011c6))
WARNING | 2019-09-27 15:03:47,962 | angr.state_plugins.symbolic_memory | Filling memory at 0x7ffffffffff0000 with 120 unconstrained bytes referenced from 0x108b130 (strcmp+0x0 in libc.so.6 (0x8b130))
[&lt;SimState @ 0x40116f&gt;]
b'yeah\x00\x80\x80\x80\x00\x80\x00\x80\x80\x80\x80\x80\x80\x80\x80 \x80\x80\x80\x80\x80\x80\x80\x80\x80\x80\x80\x80\x80\x80\x80\x80\x80\x80\x80\x80\x80\x80\x00\x80\x80\x80@\x80\x80\x80\x00\x80\x80\x01\x00\x80\x80\x80\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00'
```

Parfait, angr nous ressort bien la valeure "yeah" qui était attendue.

### Cas d'un binaire PIE

Si vous avez fait attention à la ligne de compilation du binaire précédent, vous aurez remarqué que celui l'est sans PIE. J'ai volontairement utilisé ce cas pour le premier exemple, mais la différence n'est pas très importante.

Il faut surtout retenir que lorsqu'Angr lance un programme doté du PIE il va fixer l'adresse de base à 0x400000 ( indiqué lors du lancement ).

```
cle.loader | The main binary is a position-independent executable. It is being loaded with a base address of 0x400000.
```

Il faut donc ajouter cette valeur à celle découverte lors de notre reverse via radare2 ou encore IDA qui ne fixent pas les adresses aux mêmes valeures.

### Cas d'un stdin

L'exemple précédent assez basique permet de résoudre pas mal de crackme. Toute fois, cela est possible lorsque le paramètre attendu se situe en argument. Voyons à présent comment faire lorsque le paramètre est passé via stdin (scanf et autres ) .

Cette fois ci le binaire est le suivant :

```
int main()
{
    char password[100];
    char mot_de_passe []="rand123";
    printf("Hello world!nWelcome to this first crackme !n");
    printf("Entrez le mot de passe : ");
    scanf("%s",password);
    if(strlen(password)&amp;gt;0){
    if(strcmp(password,mot_de_passe)==0)
    {
        printf("Bravo le flag est : Crackme1Solved!n");
    }
    else
    {
        printf("Bad Passwordn");
    }
    }
    else
    {
    printf("bad password");
    }
return 0;
}
```

Le passage dans r2 nous donne ceci :

```
r2 a.out
 -- Try pressing the pigeon-shaped button
[0x00401070]&gt; aaaa
[x] Analyze all flags starting with sym. and entry0 (aa)
[x] Analyze function calls (aac)
[x] Analyze len bytes of instructions for references (aar)
[x] Check for objc references
[x] Check for vtables
[x] Type matching analysis for all functions (aaft)
[x] Propagate noreturn information
[x] Use -AA or aaaa to perform additional experimental analysis.
[x] Finding function preludes
[x] Enable constraint types analysis for variables
[0x00401070]&gt; pdf@main
/ (fcn) main 211
|   int main (int argc, char **argv, char **envp);
|           ; var char *s2 @ rbp-0x78
|           ; var char *s1 @ rbp-0x70
|           ; var int32_t canary @ rbp-0x8
|           ; DATA XREF from entry0 @ 0x401091
|           0x00401156      55             push rbp
|           0x00401157      4889e5         mov rbp, rsp
|           0x0040115a      4883c480       add rsp, 0xffffffffffffff80
|           0x0040115e      64488b042528.  mov rax, qword fs:[0x28]
|           0x00401167      488945f8       mov qword [canary], rax
|           0x0040116b      31c0           xor eax, eax
|           0x0040116d      48b872616e64.  movabs rax, 0x333231646e6172 ; 'rand123'
|           0x00401177      48894588       mov qword [s2], rax
|           0x0040117b      488d3d860e00.  lea rdi, str.Hello_world_nWelcome_to_this_first_crackme__n ; 0x402008 ; "Hello world!nWelcome to this first crackme !n" ; const char *format
|           0x00401182      b800000000     mov eax, 0
|           0x00401187      e8b4feffff     call sym.imp.printf         ; int printf(const char *format)
|           0x0040118c      488d3da30e00.  lea rdi, str.Entrez_le_mot_de_passe_: ; 0x402036 ; "Entrez le mot de passe : " ; const char *format
|           0x00401193      b800000000     mov eax, 0
|           0x00401198      e8a3feffff     call sym.imp.printf         ; int printf(const char *format)
|           0x0040119d      488d4590       lea rax, [s1]
|           0x004011a1      4889c6         mov rsi, rax
|           0x004011a4      488d3da50e00.  lea rdi, [0x00402050]       ; "%s" ; const char *format
|           0x004011ab      b800000000     mov eax, 0
|           0x004011b0      e8abfeffff     call sym.imp.scanf          ; int scanf(const char *format)
|           0x004011b5      488d4590       lea rax, [s1]
|           0x004011b9      0fb600         movzx eax, byte [rax]
|           0x004011bc      84c0           test al, al
|       ,=&lt; 0x004011be      743d           je 0x4011fd
|       |   0x004011c0      488d5588       lea rdx, [s2]
|       |   0x004011c4      488d4590       lea rax, [s1]
|       |   0x004011c8      4889d6         mov rsi, rdx                ; const char *s2
|       |   0x004011cb      4889c7         mov rdi, rax                ; const char *s1
|       |   0x004011ce      e87dfeffff     call sym.imp.strcmp         ; int strcmp(const char *s1, const char *s2)
|       |   0x004011d3      85c0           test eax, eax
|      ,==&lt; 0x004011d5      7513           jne 0x4011ea
|      ||   0x004011d7      488d3d7a0e00.  lea rdi, str.Bravo_le_flag_est_:_Crackme1Solved_n ; 0x402058 ; "Bravo le flag est : Crackme1Solved!n" ; const char *format
|      ||   0x004011de      b800000000     mov eax, 0
|      ||   0x004011e3      e858feffff     call sym.imp.printf         ; int printf(const char *format)
|     ,===&lt; 0x004011e8      eb24           jmp 0x40120e
|     |||   ; CODE XREF from main @ 0x4011d5
|     |`--&gt; 0x004011ea      488d3d8c0e00.  lea rdi, str.Bad_Passwordn  ; 0x40207d ; "Bad Passwordn" ; const char *format
|     | |   0x004011f1      b800000000     mov eax, 0
|     | |   0x004011f6      e845feffff     call sym.imp.printf         ; int printf(const char *format)
|     |,==&lt; 0x004011fb      eb11           jmp 0x40120e
|     |||   ; CODE XREF from main @ 0x4011be
|     ||`-&gt; 0x004011fd      488d3d870e00.  lea rdi, str.bad_password   ; 0x40208b ; "bad password" ; const char *format
|     ||    0x00401204      b800000000     mov eax, 0
|     ||    0x00401209      e832feffff     call sym.imp.printf         ; int printf(const char *format)
|     ||    ; CODE XREFS from main @ 0x4011e8, 0x4011fb
|     ``--&gt; 0x0040120e      b800000000     mov eax, 0
|           0x00401213      488b4df8       mov rcx, qword [canary]
|           0x00401217      6448330c2528.  xor rcx, qword fs:[0x28]
|       ,=&lt; 0x00401220      7405           je 0x401227
|       |   0x00401222      e809feffff     call sym.imp.__stack_chk_fail ; void __stack_chk_fail(void)
|       |   ; CODE XREF from main @ 0x401220
|       `-&gt; 0x00401227      c9             leave
\           0x00401228      c3             ret
```

Et le code de résolution via Angr :

```
import angr
import claripy

find=0x004011d7
avoid=0x004011f6

p = angr.Project('./a.out')
stdin = claripy.BVS('flag',8*100)
state = p.factory.entry_state(args=["./a.out"],stdin=stdin)
s = p.factory.simulation_manager(state)
s.explore(find=find,avoid=avoid)

print(s.found[0])
print(s.found[0].solver.eval(stdin,cast_to=bytes))
```

Remarquez l'utilisation du paramètre _stdin=_ lors de l’initialisation de la factory. Le reste des paramètres est identique au précédent.
