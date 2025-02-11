---
title: Pourquoi j’ai décidé d’arrêter mon site de challenge
description: "Depuis plus de 7 ans je travaillais sur un site de challenge, ce soir j’ai pris la décision de l’arrêter, voici son histoire"
date: 2019-03-22
image: "/medias/articles/fin-de-hackdumb/image.png"
---

Depuis plus de 7 ans je travaillais sur un site de challenge, ce soir j’ai pris la décision de l’arrêter, voici son histoire.

## Les débuts

En septembre 2012 j’entamais mes études supérieures en informatique. Intrigué, passionné par la sécurité je me suis naturellement dirigé vers cette discipline. Il n’y a pas 36 moyens de progresser en informatique (et dans la vie en général me direz vous) : la pratique est LA clef.

Pour progresser plusieurs méthodes sont disponibles : monter un lab en local ou se lancer dans les sites de challenges. La première solution a l’avantage de vous forcer à comprendre le fonctionnement des applications que vous allez attaquer; mais l’inconvénient de demander du temps de mise en place.

Evidemment j’ai voulu me lancer rapidement dans le vif du sujet et j’ai commencé à « dépiler » les sites de challenges. Et au sein du laboratoire sécurité un petit groupe s’est formé. Notre but était d’apprendre le plus de choses possibles.

## Hackdumb

Apprendre c’est bien, apprendre et partager c’est mieux. C’est dans cet état d’esprit que nous avons voulu lancer un site de challenge. Je vous passe les détails de la création mais, nos ambitions étaient sans limites. Site de challenge, tutoriels, forum … nous voulions tout faire et avions relativement peu de compétences en développement web. Je ne parle même pas de nos connaissances sur les mécanismes de machines virtuelles.

La première version du site est sortie un an plus tard sur un serveur mutualisé d’OVH, budget étudiant oblige. Et on ne va pas se mentir, ce n’était pas la folie. Le niveau des épreuves était identique au notre : débutant. Mais les ambitions étaient la et nous étions tous très motivés.

Au top de la V1 le site réunissait une centaine d’utilisateurs pour une trentaine de challenges. Cependant, la frustration commençait à se sentir, en effet les contraintes de l’hébergement nous empêchaient par exemple de proposer des challenges d’exploitation ou « réalistes ».

## L’évolution

Petit a petit notre groupe s’est décomposé, la sécurité n’intéressait plus tout le monde. J’ai alors décidé de reprendre le projet à zéro. Etant à présent en contrat professionnel j’avais tout ce dont rêve un étudiant : du temps et de l’argent. Exit le mutualisé, bonjour le dédié ! Finit le site développé en PHP / MySQL, place au combo NodeJS / MongoDB et surtout, plus de challenge simulés.

Docker, était (et est toujours à vrai dire) pour moi la solution la plus adaptée pour les challenges. Facile à déployer, à administrer et permettant de proposer un environnement complet dédié à un challenge sans avoir la lourdeur d’une machine virtuelle.

C’était une révolution ! Je pouvais maintenant créer tous les challenges de mon choix et les mettre en ligne simplement. Les contraintes techniques m’ont permis d’apprendre pleins de choses ! Je n’avais en effet qu’une seule adresse IP sur le serveur. Afin de joindre les challenges tout passait alors par un reverse proxy que j’ai développé pour l’occasion. En utilisant cloudflare je pouvais rapidement avoir une URL associé à un challenge unique. A son meilleur, le site avait 300 utilisateurs, j’étais plutôt fier.

## La fin ?

Vous me direz, tout va pour le mieux ! J’ai cependant décidé d’arrêter pour plusieurs raisons. La première c’est que j’étais finalement tout seul à maintenir le projet. Et le travail est assez important pour proposer un service de qualité. Créer des challenges, mettre à jour les machines, assurer le support… Je peux comprendre que tout cela n’est pas forcément motivant.

La seconde et surement la principale c’est le manque de temps. A tout les étudiants qui liront ce post : profitez de votre statut c’est le meilleur qui soit. Aujourd’hui je fais le métier que je voulais faire, j’ai l’impression de résoudre des challenges chaque semaine, c’est fantastique. Cependant, lorsque la journée est finie j’ai envie de faire d’autres choses et mon investissement dans le projet s’en est retrouvé impacté.

Le titre de cette partie comporte un point d’interrogation, il ne s’agit pas d’une erreur. Avant de résilier mon abonnement j’ai conservé l’ensemble des challenges et des sources du site. Le projet prend une grande pause, c’est surement la fin du projet tel quel, mais une nouvelle évolution est totalement envisageable, en tout cas je n’y suis pas fermé.
