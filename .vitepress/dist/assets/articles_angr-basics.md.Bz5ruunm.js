import{_ as a,c as n,o as e,af as p}from"./chunks/framework.CgkrJXe5.js";const m=JSON.parse(`{"title":"Angr - Basics","description":"L'ingénierie inversée de binaires peut être une opération délicate. Il arrive assez souvent en challenges ou CTF que les fonctions de vérifications soient volontairement complexes. Heureusement des outils sont disponibles pour nous aider, aujourd'hui intéressons nous à Angr.","frontmatter":{"title":"Angr - Basics","date":"2019-10-03","description":"L'ingénierie inversée de binaires peut être une opération délicate. Il arrive assez souvent en challenges ou CTF que les fonctions de vérifications soient volontairement complexes. Heureusement des outils sont disponibles pour nous aider, aujourd'hui intéressons nous à Angr.","categories":["reverse-engineering","tutos"],"image":"/medias/articles/angr-basics/625456_0b23_2.jpg"},"headers":[],"relativePath":"articles/angr-basics.md","filePath":"articles/angr-basics.md"}`),i={name:"articles/angr-basics.md"};function l(t,s,r,o,c,d){return e(),n("div",null,s[0]||(s[0]=[p(`<p>Si on en crois les propos reportés régulièrement lors du SSTIC, les outils de reverse engineering ( RE ) ont une durée de vie très faible, chaque &quot;reverser&quot; préférant coder son propre outil plutôt qu&#39;améliorer les précédents. Difficile alors de prévoir la durée de vie d&#39;un outil. Personnellement je n&#39;ai pas encore la prétention de me plaindre des fonctionnalités d&#39;un outil, je préfère composer avec plusieurs d&#39;entre eux.</p><p>Angr est un outil qui peut être utilisé pour pas mal de tâches. Nous allons aujourd&#39;hui voir comment utiliser ses fonctionnalités de solveur de contrainte.</p><h3 id="l-apprentissage-par-l-exemple" tabindex="-1">L&#39;apprentissage par l&#39;exemple <a class="header-anchor" href="#l-apprentissage-par-l-exemple" aria-label="Permalink to &quot;L&#39;apprentissage par l&#39;exemple&quot;">​</a></h3><p>Comme un bon exemple vaut mieux qu&#39;un long discours je vous propose de passer directement à la partie pratique.</p><p>Considérons le code suivant, l&#39;objectif est de faire afficher au binaire la sortie &quot;win&quot;. Pour cela, à la lecture du code nous constatons qu&#39;il suffit de rentrer la chaine &quot;yeah&quot; en argument (argv[1]).</p><div class="language- vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang"></span><pre class="shiki shiki-themes github-light github-dark vp-code" tabindex="0"><code><span class="line"><span>#include &lt;stdio.h&gt;</span></span>
<span class="line"><span>#include &lt;string.h&gt;</span></span>
<span class="line"><span>int main(int argc, char * argv[])</span></span>
<span class="line"><span>{</span></span>
<span class="line"><span>  if (strcmp(argv[1], &quot;yeah&quot;) == 0)</span></span>
<span class="line"><span>   {</span></span>
<span class="line"><span>    printf(&quot;win&quot;);</span></span>
<span class="line"><span>   }</span></span>
<span class="line"><span>   else</span></span>
<span class="line"><span>   {</span></span>
<span class="line"><span>     printf(&quot;fail&quot;);</span></span>
<span class="line"><span>   }</span></span>
<span class="line"><span>  return 0;</span></span>
<span class="line"><span>}</span></span></code></pre></div><div class="language- vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang"></span><pre class="shiki shiki-themes github-light github-dark vp-code" tabindex="0"><code><span class="line"><span>gcc code.c -no-pie</span></span></code></pre></div><p>Evidemment, cet exemple est assez trivial mais suffisant pour poser les bases d&#39;Angr. Ce qu&#39;il est important de retenir, c&#39;est que l&#39;on souhaite faire exécuter la ligne &#39;printf(&quot;win&quot;)&#39;. Et c&#39;est exactement ce que l&#39;on va demander au programme. Angr va ici être utilisé pour résoudre les contraintes permettant d’exécuter cette ligne du programme.</p><h4 id="un-peu-de-reverse-engineering" tabindex="-1">Un peu de reverse engineering <a class="header-anchor" href="#un-peu-de-reverse-engineering" aria-label="Permalink to &quot;Un peu de reverse engineering&quot;">​</a></h4><p>Bien sur, il ne suffit pas d&#39;énoncer une phrase magique devant son laptop pour que cela se produise. Il va falloir configurer angr afin de lui donner les bonnes valeurs. Je vais donc utiliser r2 pour cette étape.</p><div class="language- vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang"></span><pre class="shiki shiki-themes github-light github-dark vp-code" tabindex="0"><code><span class="line"><span>r2 a.out</span></span>
<span class="line"><span>a -- *(ut64*)buffer ought to be illegal</span></span>
<span class="line"><span>[0x00401050]&amp;gt; aaaa</span></span>
<span class="line"><span>[x] Analyze all flags starting with sym. and entry0 (aa)</span></span>
<span class="line"><span>[x] Analyze function calls (aac)</span></span>
<span class="line"><span>[x] Analyze len bytes of instructions for references (aar)</span></span>
<span class="line"><span>[x] Check for objc references</span></span>
<span class="line"><span>[x] Check for vtables</span></span>
<span class="line"><span>[x] Type matching analysis for all functions (aaft)</span></span>
<span class="line"><span>[x] Propagate noreturn information</span></span>
<span class="line"><span>[x] Use -AA or aaaa to perform additional experimental analysis.</span></span>
<span class="line"><span>[x] Finding function preludes</span></span>
<span class="line"><span>[x] Enable constraint types analysis for variables</span></span>
<span class="line"><span>[0x00401050]&amp;gt; pdf@main</span></span>
<span class="line"><span>/ (fcn) main 88</span></span>
<span class="line"><span>|   int main (int argc, char **argv, char **envp);</span></span>
<span class="line"><span>|           ; var char **s1 @ rbp-0x10</span></span>
<span class="line"><span>|           ; var int32_t var_4h @ rbp-0x4</span></span>
<span class="line"><span>|           ; arg int argc @ rdi</span></span>
<span class="line"><span>|           ; arg char **argv @ rsi</span></span>
<span class="line"><span>|           ; DATA XREF from entry0 @ 0x401071</span></span>
<span class="line"><span>|           0x00401136      55             push rbp</span></span>
<span class="line"><span>|           0x00401137      4889e5         mov rbp, rsp</span></span>
<span class="line"><span>|           0x0040113a      4883ec10       sub rsp, 0x10</span></span>
<span class="line"><span>|           0x0040113e      897dfc         mov dword [var_4h], edi     ; argc</span></span>
<span class="line"><span>|           0x00401141      488975f0       mov qword [s1], rsi         ; argv</span></span>
<span class="line"><span>|           0x00401145      488b45f0       mov rax, qword [s1]</span></span>
<span class="line"><span>|           0x00401149      4883c008       add rax, 8</span></span>
<span class="line"><span>|           0x0040114d      488b00         mov rax, qword [rax]</span></span>
<span class="line"><span>|           0x00401150      488d35ad0e00.  lea rsi, str.yeah           ; 0x402004 ; &quot;yeah&quot; ; const char *s2</span></span>
<span class="line"><span>|           0x00401157      4889c7         mov rdi, rax                ; const char *s1</span></span>
<span class="line"><span>|           0x0040115a      e8e1feffff     call sym.imp.strcmp         ; int strcmp(const char *s1, const char *s2)</span></span>
<span class="line"><span>|           0x0040115f      85c0           test eax, eax</span></span>
<span class="line"><span>|       ,=&amp;lt; 0x00401161      7513           jne 0x401176</span></span>
<span class="line"><span>|       |   0x00401163      488d3d9f0e00.  lea rdi, [0x00402009]       ; &quot;win&quot; ; const char *format</span></span>
<span class="line"><span>|       |   0x0040116a      b800000000     mov eax, 0</span></span>
<span class="line"><span>|       |   0x0040116f      e8bcfeffff     call sym.imp.printf         ; int printf(const char *format)</span></span>
<span class="line"><span>|      ,==&amp;lt; 0x00401174      eb11           jmp 0x401187</span></span>
<span class="line"><span>|      ||   ; CODE XREF from main @ 0x401161</span></span>
<span class="line"><span>|      |\`-&amp;gt; 0x00401176      488d3d900e00.  lea rdi, str.fail           ; 0x40200d ; &quot;fail&quot; ; const char *format</span></span>
<span class="line"><span>|      |    0x0040117d      b800000000     mov eax, 0</span></span>
<span class="line"><span>|      |    0x00401182      e8a9feffff     call sym.imp.printf         ; int printf(const char *format)</span></span>
<span class="line"><span>|      |    ; CODE XREF from main @ 0x401174</span></span>
<span class="line"><span>|      \`--&amp;gt; 0x00401187      b800000000     mov eax, 0</span></span>
<span class="line"><span>|           0x0040118c      c9             leave</span></span>
<span class="line"><span>\\           0x0040118d      c3             ret</span></span>
<span class="line"><span>[0x00401050]&amp;gt;</span></span></code></pre></div><p>Nous voyons ici que l&#39;adresse à la quelle nous souhaitons arriver est 0x0040116f (printf(&#39;win&#39;)). L&#39;adresse que l&#39;on souhaite éviter est 0x00401182. De plus, nous voyons que l&#39;argument est attendu en paramètre &quot;argv1&quot;. C&#39;est ici toutes les informations nécessaires pour lancer angr.</p><h4 id="angr" tabindex="-1">Angr <a class="header-anchor" href="#angr" aria-label="Permalink to &quot;Angr&quot;">​</a></h4><p>Pour résoudre ce crackme, le code angr suivant peut être utilisé ( pas de soucis, je détaille chaque ligne juste après )</p><div class="language- vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang"></span><pre class="shiki shiki-themes github-light github-dark vp-code" tabindex="0"><code><span class="line"><span>import angr</span></span>
<span class="line"><span>import claripy</span></span>
<span class="line"><span>find = 0x0040116f</span></span>
<span class="line"><span>avoid = 0x00401182</span></span>
<span class="line"><span>p = angr.Project(&#39;./a.out&#39;)</span></span>
<span class="line"><span>argv1 = claripy.BVS(&#39;password&#39;,8*100)</span></span>
<span class="line"><span>state = p.factory.entry_state(args=[&quot;./a.out&quot;,argv1])</span></span>
<span class="line"><span>s = p.factory.simulation_manager(state)</span></span>
<span class="line"><span>s.explore(find=find,avoid=avoid)</span></span>
<span class="line"><span></span></span>
<span class="line"><span>print(s.found)</span></span>
<span class="line"><span>found = s.found[0]</span></span>
<span class="line"><span></span></span>
<span class="line"><span>print(found.solver.eval(argv1,cast_to=bytes))</span></span></code></pre></div><p>1 ) import de la librairie angr, je ne vois pas trop quoi expliquer sur cette étape 😃.</p><ol start="2"><li><p>import de claripy. Claripy est un des nombreux sous projets développé par Angr, il s&#39;agit du solveur de contrainte d&#39;Angr il fonctionne un peu comme z3 dont il utilise des fonctionnalités.</p></li><li><p>l&#39;adresse mémoire à la quelle on souhaite accéder.</p></li><li><p>l&#39;adresse mémoire que l&#39;on souhaite éviter.</p></li><li><p>création du projet Angr, a.out représente ici le nom de mon binaire.</p></li><li><p>création d&#39;une contrainte Claripy. Ici, nous avons identifié que la variable argv1 était celle qui devrais contenir le pass attendu. Pour la taille j&#39;ai fixé arbitrairement 8*100 bits, si cette taille est trop importante le programme comblera avec des NULL. Enfin le type BVS correspond à BitVectorSymbolic puisque la valeur sera stockée au même endroit que le serait le &quot;vrai&quot; argv[1].</p></li><li><p>La &quot;factory&quot; est une méthode permettant d&#39;initaliser un projet. La méthode entryState permet de définir les paramètres de lancements du binaire. Il serait par exemple possible de définir l&#39;état de certains registres à l&#39;avance ect. Ici à la manière d&#39;un execve on passe le tableau d&#39;arg au programme ( nottez que argv1 fait référence à notre variable claripy ).</p></li><li><p>Le simulation manager est un autre des composants d&#39;angr, celui ci permet de contrôler le flot d’exécution en fonction des states définis.</p></li><li><p>L&#39;utilisation de la méthode &quot;explore&quot; du simulation manager demande au programme de résoudre les contraintes jusqu’à ce que l&#39;adresse indiquée en paramètre &quot;find&quot; soit atteinte.</p></li></ol><p>11 12 et 14 ) il s&#39;agit ici de print du résultat avec différents formatages</p><p>Maintenant que nous avons compris chaque ligne de notre programme il n&#39;y a plus qu&#39;a le lancer.</p><div class="language- vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang"></span><pre class="shiki shiki-themes github-light github-dark vp-code" tabindex="0"><code><span class="line"><span>python an.py                                                                                                                                                      ✘ 2</span></span>
<span class="line"><span>WARNING | 2019-09-27 15:03:47,870 | angr.state_plugins.symbolic_memory | The program is accessing memory or registers with an unspecified value. This could indicate unwanted behavior.</span></span>
<span class="line"><span>WARNING | 2019-09-27 15:03:47,870 | angr.state_plugins.symbolic_memory | angr will cope with this by generating an unconstrained symbolic variable and continuing. You can resolve this by:</span></span>
<span class="line"><span>WARNING | 2019-09-27 15:03:47,870 | angr.state_plugins.symbolic_memory | 1) setting a value to the initial state</span></span>
<span class="line"><span>WARNING | 2019-09-27 15:03:47,870 | angr.state_plugins.symbolic_memory | 2) adding the state option ZERO_FILL_UNCONSTRAINED_{MEMORY,REGISTERS}, to make unknown regions hold null</span></span>
<span class="line"><span>WARNING | 2019-09-27 15:03:47,870 | angr.state_plugins.symbolic_memory | 3) adding the state option SYMBOL_FILL_UNCONSTRAINED_{MEMORY_REGISTERS}, to suppress these messages.</span></span>
<span class="line"><span>WARNING | 2019-09-27 15:03:47,870 | angr.state_plugins.symbolic_memory | Filling register r15 with 8 unconstrained bytes referenced from 0x401190 (__libc_csu_init+0x0 in a.out (0x401190))</span></span>
<span class="line"><span>WARNING | 2019-09-27 15:03:47,872 | angr.state_plugins.symbolic_memory | Filling register r14 with 8 unconstrained bytes referenced from 0x401199 (__libc_csu_init+0x9 in a.out (0x401199))</span></span>
<span class="line"><span>WARNING | 2019-09-27 15:03:47,873 | angr.state_plugins.symbolic_memory | Filling register r13 with 8 unconstrained bytes referenced from 0x40119e (__libc_csu_init+0xe in a.out (0x40119e))</span></span>
<span class="line"><span>WARNING | 2019-09-27 15:03:47,875 | angr.state_plugins.symbolic_memory | Filling register r12 with 8 unconstrained bytes referenced from 0x4011a3 (__libc_csu_init+0x13 in a.out (0x4011a3))</span></span>
<span class="line"><span>WARNING | 2019-09-27 15:03:47,878 | angr.state_plugins.symbolic_memory | Filling register rbx with 8 unconstrained bytes referenced from 0x4011b4 (__libc_csu_init+0x24 in a.out (0x4011b4))</span></span>
<span class="line"><span>WARNING | 2019-09-27 15:03:47,895 | angr.state_plugins.symbolic_memory | Filling register cc_ndep with 8 unconstrained bytes referenced from 0x4011c6 (__libc_csu_init+0x36 in a.out (0x4011c6))</span></span>
<span class="line"><span>WARNING | 2019-09-27 15:03:47,962 | angr.state_plugins.symbolic_memory | Filling memory at 0x7ffffffffff0000 with 120 unconstrained bytes referenced from 0x108b130 (strcmp+0x0 in libc.so.6 (0x8b130))</span></span>
<span class="line"><span>[&amp;lt;SimState @ 0x40116f&amp;gt;]</span></span>
<span class="line"><span>b&#39;yeah\\x00\\x80\\x80\\x80\\x00\\x80\\x00\\x80\\x80\\x80\\x80\\x80\\x80\\x80\\x80 \\x80\\x80\\x80\\x80\\x80\\x80\\x80\\x80\\x80\\x80\\x80\\x80\\x80\\x80\\x80\\x80\\x80\\x80\\x80\\x80\\x80\\x80\\x00\\x80\\x80\\x80@\\x80\\x80\\x80\\x00\\x80\\x80\\x01\\x00\\x80\\x80\\x80\\x00\\x00\\x00\\x00\\x00\\x00\\x00\\x00\\x00\\x00\\x00\\x00\\x00\\x00\\x00\\x00\\x00\\x00\\x00\\x00\\x00\\x00\\x00\\x00\\x00\\x00\\x00\\x00\\x00\\x00\\x00\\x00\\x00\\x00\\x00\\x00\\x00\\x00\\x00\\x00\\x00\\x00&#39;</span></span></code></pre></div><p>Parfait, angr nous ressort bien la valeure &quot;yeah&quot; qui était attendue.</p><h3 id="cas-d-un-binaire-pie" tabindex="-1">Cas d&#39;un binaire PIE <a class="header-anchor" href="#cas-d-un-binaire-pie" aria-label="Permalink to &quot;Cas d&#39;un binaire PIE&quot;">​</a></h3><p>Si vous avez fait attention à la ligne de compilation du binaire précédent, vous aurez remarqué que celui l&#39;est sans PIE. J&#39;ai volontairement utilisé ce cas pour le premier exemple, mais la différence n&#39;est pas très importante.</p><p>Il faut surtout retenir que lorsqu&#39;Angr lance un programme doté du PIE il va fixer l&#39;adresse de base à 0x400000 ( indiqué lors du lancement ).</p><div class="language- vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang"></span><pre class="shiki shiki-themes github-light github-dark vp-code" tabindex="0"><code><span class="line"><span>cle.loader | The main binary is a position-independent executable. It is being loaded with a base address of 0x400000.</span></span></code></pre></div><p>Il faut donc ajouter cette valeur à celle découverte lors de notre reverse via radare2 ou encore IDA qui ne fixent pas les adresses aux mêmes valeures.</p><h3 id="cas-d-un-stdin" tabindex="-1">Cas d&#39;un stdin <a class="header-anchor" href="#cas-d-un-stdin" aria-label="Permalink to &quot;Cas d&#39;un stdin&quot;">​</a></h3><p>L&#39;exemple précédent assez basique permet de résoudre pas mal de crackme. Toute fois, cela est possible lorsque le paramètre attendu se situe en argument. Voyons à présent comment faire lorsque le paramètre est passé via stdin (scanf et autres ) .</p><p>Cette fois ci le binaire est le suivant :</p><div class="language- vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang"></span><pre class="shiki shiki-themes github-light github-dark vp-code" tabindex="0"><code><span class="line"><span>int main()</span></span>
<span class="line"><span>{</span></span>
<span class="line"><span>    char password[100];</span></span>
<span class="line"><span>    char mot_de_passe []=&quot;rand123&quot;;</span></span>
<span class="line"><span>    printf(&quot;Hello world!nWelcome to this first crackme !n&quot;);</span></span>
<span class="line"><span>    printf(&quot;Entrez le mot de passe : &quot;);</span></span>
<span class="line"><span>    scanf(&quot;%s&quot;,password);</span></span>
<span class="line"><span>    if(strlen(password)&amp;amp;gt;0){</span></span>
<span class="line"><span>    if(strcmp(password,mot_de_passe)==0)</span></span>
<span class="line"><span>    {</span></span>
<span class="line"><span>        printf(&quot;Bravo le flag est : Crackme1Solved!n&quot;);</span></span>
<span class="line"><span>    }</span></span>
<span class="line"><span>    else</span></span>
<span class="line"><span>    {</span></span>
<span class="line"><span>        printf(&quot;Bad Passwordn&quot;);</span></span>
<span class="line"><span>    }</span></span>
<span class="line"><span>    }</span></span>
<span class="line"><span>    else</span></span>
<span class="line"><span>    {</span></span>
<span class="line"><span>    printf(&quot;bad password&quot;);</span></span>
<span class="line"><span>    }</span></span>
<span class="line"><span>return 0;</span></span>
<span class="line"><span>}</span></span></code></pre></div><p>Le passage dans r2 nous donne ceci :</p><div class="language- vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang"></span><pre class="shiki shiki-themes github-light github-dark vp-code" tabindex="0"><code><span class="line"><span>r2 a.out</span></span>
<span class="line"><span> -- Try pressing the pigeon-shaped button</span></span>
<span class="line"><span>[0x00401070]&amp;gt; aaaa</span></span>
<span class="line"><span>[x] Analyze all flags starting with sym. and entry0 (aa)</span></span>
<span class="line"><span>[x] Analyze function calls (aac)</span></span>
<span class="line"><span>[x] Analyze len bytes of instructions for references (aar)</span></span>
<span class="line"><span>[x] Check for objc references</span></span>
<span class="line"><span>[x] Check for vtables</span></span>
<span class="line"><span>[x] Type matching analysis for all functions (aaft)</span></span>
<span class="line"><span>[x] Propagate noreturn information</span></span>
<span class="line"><span>[x] Use -AA or aaaa to perform additional experimental analysis.</span></span>
<span class="line"><span>[x] Finding function preludes</span></span>
<span class="line"><span>[x] Enable constraint types analysis for variables</span></span>
<span class="line"><span>[0x00401070]&amp;gt; pdf@main</span></span>
<span class="line"><span>/ (fcn) main 211</span></span>
<span class="line"><span>|   int main (int argc, char **argv, char **envp);</span></span>
<span class="line"><span>|           ; var char *s2 @ rbp-0x78</span></span>
<span class="line"><span>|           ; var char *s1 @ rbp-0x70</span></span>
<span class="line"><span>|           ; var int32_t canary @ rbp-0x8</span></span>
<span class="line"><span>|           ; DATA XREF from entry0 @ 0x401091</span></span>
<span class="line"><span>|           0x00401156      55             push rbp</span></span>
<span class="line"><span>|           0x00401157      4889e5         mov rbp, rsp</span></span>
<span class="line"><span>|           0x0040115a      4883c480       add rsp, 0xffffffffffffff80</span></span>
<span class="line"><span>|           0x0040115e      64488b042528.  mov rax, qword fs:[0x28]</span></span>
<span class="line"><span>|           0x00401167      488945f8       mov qword [canary], rax</span></span>
<span class="line"><span>|           0x0040116b      31c0           xor eax, eax</span></span>
<span class="line"><span>|           0x0040116d      48b872616e64.  movabs rax, 0x333231646e6172 ; &#39;rand123&#39;</span></span>
<span class="line"><span>|           0x00401177      48894588       mov qword [s2], rax</span></span>
<span class="line"><span>|           0x0040117b      488d3d860e00.  lea rdi, str.Hello_world_nWelcome_to_this_first_crackme__n ; 0x402008 ; &quot;Hello world!nWelcome to this first crackme !n&quot; ; const char *format</span></span>
<span class="line"><span>|           0x00401182      b800000000     mov eax, 0</span></span>
<span class="line"><span>|           0x00401187      e8b4feffff     call sym.imp.printf         ; int printf(const char *format)</span></span>
<span class="line"><span>|           0x0040118c      488d3da30e00.  lea rdi, str.Entrez_le_mot_de_passe_: ; 0x402036 ; &quot;Entrez le mot de passe : &quot; ; const char *format</span></span>
<span class="line"><span>|           0x00401193      b800000000     mov eax, 0</span></span>
<span class="line"><span>|           0x00401198      e8a3feffff     call sym.imp.printf         ; int printf(const char *format)</span></span>
<span class="line"><span>|           0x0040119d      488d4590       lea rax, [s1]</span></span>
<span class="line"><span>|           0x004011a1      4889c6         mov rsi, rax</span></span>
<span class="line"><span>|           0x004011a4      488d3da50e00.  lea rdi, [0x00402050]       ; &quot;%s&quot; ; const char *format</span></span>
<span class="line"><span>|           0x004011ab      b800000000     mov eax, 0</span></span>
<span class="line"><span>|           0x004011b0      e8abfeffff     call sym.imp.scanf          ; int scanf(const char *format)</span></span>
<span class="line"><span>|           0x004011b5      488d4590       lea rax, [s1]</span></span>
<span class="line"><span>|           0x004011b9      0fb600         movzx eax, byte [rax]</span></span>
<span class="line"><span>|           0x004011bc      84c0           test al, al</span></span>
<span class="line"><span>|       ,=&amp;lt; 0x004011be      743d           je 0x4011fd</span></span>
<span class="line"><span>|       |   0x004011c0      488d5588       lea rdx, [s2]</span></span>
<span class="line"><span>|       |   0x004011c4      488d4590       lea rax, [s1]</span></span>
<span class="line"><span>|       |   0x004011c8      4889d6         mov rsi, rdx                ; const char *s2</span></span>
<span class="line"><span>|       |   0x004011cb      4889c7         mov rdi, rax                ; const char *s1</span></span>
<span class="line"><span>|       |   0x004011ce      e87dfeffff     call sym.imp.strcmp         ; int strcmp(const char *s1, const char *s2)</span></span>
<span class="line"><span>|       |   0x004011d3      85c0           test eax, eax</span></span>
<span class="line"><span>|      ,==&amp;lt; 0x004011d5      7513           jne 0x4011ea</span></span>
<span class="line"><span>|      ||   0x004011d7      488d3d7a0e00.  lea rdi, str.Bravo_le_flag_est_:_Crackme1Solved_n ; 0x402058 ; &quot;Bravo le flag est : Crackme1Solved!n&quot; ; const char *format</span></span>
<span class="line"><span>|      ||   0x004011de      b800000000     mov eax, 0</span></span>
<span class="line"><span>|      ||   0x004011e3      e858feffff     call sym.imp.printf         ; int printf(const char *format)</span></span>
<span class="line"><span>|     ,===&amp;lt; 0x004011e8      eb24           jmp 0x40120e</span></span>
<span class="line"><span>|     |||   ; CODE XREF from main @ 0x4011d5</span></span>
<span class="line"><span>|     |\`--&amp;gt; 0x004011ea      488d3d8c0e00.  lea rdi, str.Bad_Passwordn  ; 0x40207d ; &quot;Bad Passwordn&quot; ; const char *format</span></span>
<span class="line"><span>|     | |   0x004011f1      b800000000     mov eax, 0</span></span>
<span class="line"><span>|     | |   0x004011f6      e845feffff     call sym.imp.printf         ; int printf(const char *format)</span></span>
<span class="line"><span>|     |,==&amp;lt; 0x004011fb      eb11           jmp 0x40120e</span></span>
<span class="line"><span>|     |||   ; CODE XREF from main @ 0x4011be</span></span>
<span class="line"><span>|     ||\`-&amp;gt; 0x004011fd      488d3d870e00.  lea rdi, str.bad_password   ; 0x40208b ; &quot;bad password&quot; ; const char *format</span></span>
<span class="line"><span>|     ||    0x00401204      b800000000     mov eax, 0</span></span>
<span class="line"><span>|     ||    0x00401209      e832feffff     call sym.imp.printf         ; int printf(const char *format)</span></span>
<span class="line"><span>|     ||    ; CODE XREFS from main @ 0x4011e8, 0x4011fb</span></span>
<span class="line"><span>|     \`\`--&amp;gt; 0x0040120e      b800000000     mov eax, 0</span></span>
<span class="line"><span>|           0x00401213      488b4df8       mov rcx, qword [canary]</span></span>
<span class="line"><span>|           0x00401217      6448330c2528.  xor rcx, qword fs:[0x28]</span></span>
<span class="line"><span>|       ,=&amp;lt; 0x00401220      7405           je 0x401227</span></span>
<span class="line"><span>|       |   0x00401222      e809feffff     call sym.imp.__stack_chk_fail ; void __stack_chk_fail(void)</span></span>
<span class="line"><span>|       |   ; CODE XREF from main @ 0x401220</span></span>
<span class="line"><span>|       \`-&amp;gt; 0x00401227      c9             leave</span></span>
<span class="line"><span>\\           0x00401228      c3             ret</span></span></code></pre></div><p>Et le code de résolution via Angr :</p><div class="language- vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang"></span><pre class="shiki shiki-themes github-light github-dark vp-code" tabindex="0"><code><span class="line"><span>import angr</span></span>
<span class="line"><span>import claripy</span></span>
<span class="line"><span></span></span>
<span class="line"><span>find=0x004011d7</span></span>
<span class="line"><span>avoid=0x004011f6</span></span>
<span class="line"><span></span></span>
<span class="line"><span>p = angr.Project(&#39;./a.out&#39;)</span></span>
<span class="line"><span>stdin = claripy.BVS(&#39;flag&#39;,8*100)</span></span>
<span class="line"><span>state = p.factory.entry_state(args=[&quot;./a.out&quot;],stdin=stdin)</span></span>
<span class="line"><span>s = p.factory.simulation_manager(state)</span></span>
<span class="line"><span>s.explore(find=find,avoid=avoid)</span></span>
<span class="line"><span></span></span>
<span class="line"><span>print(s.found[0])</span></span>
<span class="line"><span>print(s.found[0].solver.eval(stdin,cast_to=bytes))</span></span></code></pre></div><p>Remarquez l&#39;utilisation du paramètre <em>stdin=</em> lors de l’initialisation de la factory. Le reste des paramètres est identique au précédent.</p>`,35)]))}const x=a(i,[["render",l]]);export{m as __pageData,x as default};
