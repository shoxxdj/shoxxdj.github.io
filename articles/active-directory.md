---
title: "Active Directory"
date: "2022-11-26"
description: "Avant de commencer à parler d’exploitation de vulnérabilités en environnement Active Directory il est important de savoir de quoi il s’agit."
categories:
  - "active-directory"
image: "/medias/articles/active-directory/active-directory-logo.png"
---

Avant de commencer à parler d'exploitation de vulnérabilités en environnement Active Directory il est important de savoir de quoi il s'agit.

### Historique

L’environnement "AD" à été initié en 1996 par Microsoft et est disponible depuis 1999. L'objectif de cet équipement est de proposer un annuaire LDAP dans l’environnement Microsoft. Ces derniers ayant une grande part de marché dans les entreprises cette implémentation "maison" est logique car elle permet de proposer de nombreuses fonctionnalités d'administration et de segmentation.

Et bien que les chapitres qui vont survient traitent de vulnérabilités relatives à des défauts de configuration il est important de noter qu'un Active Directory bien configuré et durci est un élément important de la sécurité d'un Système d'Information.

La fonctionnalité AD s'installe sur une version "Server" de Windows, généralement celui-ci se nomme "Contrôleur de Domaine" . De nombreuses versions d'Active Directory ont été proposées par Microsoft depuis sa sortie initiale chacune apportant son lot de nouveautés.

Il est donc possible que vous rencontriez les versions suivantes :

- Windows 2000 Server Edition
- Windows Server 2003
- Windows Server 2008
- Windows Server 2008 R2
- Windows Server 2012
- Windows Server 2012 R2
- Windows Server 2016
- Windows Server 2019
- Windows Server 2022

Pour les plus anciennes d'entre elles, je pense que vous n'aurez pas trop de difficultés à trouver des vulnérabilités connues et souvent référencés dans Metasploit. Enfin, certaines implémentations "Exotiques" existent, mais il n'en sera pas questions ici.

Petite anecdote sur le _naming_, au tout départ celui-ci devait s'appeler NT Discovery Services (NTDS), ce nom se retrouvera notamment au niveau du fichier stockant les empreintes de mots de passes des utilisateurs : NTDS.DIT ( équivalent d'une base SAM sur un AD). Un fichier que nous allons chercher à récupérer.

### Lexique

Pour la suite des événements nous allons utiliser un lexique classique dans cet environnement, mais qui peut paraître complexe.

#### Un objet

Un AD permet de stocker des informations sur le domaine, pour cela, les éléments à administrer sont classés en catégories d'"objets". Chaque objet est une entité administrable. Parmi ces objets on retrouve:

- OU ( Organisational Unit : Utilisés pour effectuer des délégations de droits, une sorte de "groupe d'objets" à ne pas confondre avec l'objet Groupe)
- Des ordinateurs
- Des utilisateurs
- Des groupes ( D'ordinateur et / ou d'utilisateurs ), souvent utilisés pour attribuer des droits à un ensemble d'utilisateurs regroupés

#### Derrière les arbres, la foret

La première fois que j'ai entendu parler de "Foret" je me suis demandé si ce n'était pas une blague, et pourtant, l'explication est bien plus simple en Français.

Les objets d'un Active Directory sont classés en fonction d'une hiérarchie, ce qui permet d'introduire des héritages de droits. Un AD, hébergeant un "Domaine", permet utilise ces concepts de hiérarchie afin d'établir une arborescence de privilèges.

De plus, une organisation peut avoir plusieurs AD au sein de son réseau, c'est souvent le cas des établissement qui se regroupent suite à des rachats. Pour distinguer les emplacement de chaque ressource, AD se base sur le DNS ce qui permet de créer des domaines et des sous domaines.

Ainsi nous nous retrouvons avec :

- Une foret, contenant des arbres, contenant des domaines.
- Par analogie : Une foret, contenant des arbres, contenant des feuilles.
- La foret représente l'ensemble des domaines et sous domaines AD.
- Un arbre un domaine avec l'ensemble de ses sous domaines
- Un domaine un seul domaine.

![Représentation d'une foret](/medias/articles/active-directory/image-2.png)

Plusieurs forets peuvent être liées ensemble au sein d'un "Trust" mais nous verrons cela plus tard.

#### Les attributs

Chaque objet d'un environnement AD dispose d'attributs. Parmi les plus connus, _name_ pour le nom, _sAMccountName_ pour l'identifiant (Logon) ou encore _lastLogon_ pour la date de dernière connexion.

Des attributs, il en existe beaucoup, et nous auront l'occasion de nous en servir à différents moments.

#### Les droits des utilisateurs

Au sein d'un environnement AD les utilisateurs peuvent avoir différents rôles, ceux-ci sont principalement gérés dans les groupes auxquelles ils appartiennent ainsi qu'aux délégations de droits dont il pourraient bénéficier.

En pratique, des utilisateurs "lambdas" ne disposent pas de droits particulièrement intéressants pour un attaquant si ce n'est par exemple l'accès à certains partages réseaux ou à certaines applications.

Des utilisateurs privilégiés sont présent dans le réseau, on parle alors de compte "Administrateur" pour les plus importants d'entre eux. Le groupe "Administrateur du Domaine" regroupe par définition les utilisateurs responsables de l'administration de l'AD.

Cependant retenez bien que ce titre et l'appartenance à un tel groupe n'est pas la seule option pour obtenir des privilèges importants sur le réseau. Certains utilisateurs sont capables d'effectuer des opérations grâce à des délégations de droits, ou à l'attribution d'un privilège particulier, on parle alors de "Shadow Admin".

Ainsi un utilisateur disposant du privilège DCSync est capable d'obtenir une copie des informations de l'AD .. dont la base NTDS.dit, c'est à dire l'empreinte de tous les mots de passe de cet annuaire. Plutôt intéressant pour un attaquant.

### Le gros défaut de Microsoft

Ce titre est volontairement provocateur, mais vous allez vite comprendre l'idée. Nous avons vu plus haut que Microsoft proposait des nouvelles versions de Windows Server et de l'applicatif Active Directory "régulièrement". Cependant, chacune de ses mises à jour inclus des mécanismes de rétrocompatibilité. Imaginez devoir changer l'ensemble d'un parc informatique parce que la nouvelle version d'Active Directory ne supporte plus l'authentification NTLM, si vous savez de quoi il s'agit vous allez trouver ça bien, mais en pratique c'est ingérable pour les clients de Microsoft. J'écris cet article en 2022 et il m'arrive encore de trouver des machines sous Windows XP / 7 dans les entreprises que je visite. Certaines moutures de Windows ont été créées il y a 15 ans et le code du système d'exploitation ne permet pas d'adopter certaines fonctionnalités de sécurité.

Ainsi, installer un AD "neuf" en 2022 ne garantie pas que l'ensemble du parc sera protégé, en réalité, le niveau de sécurité dépendra du niveau de la machine la plus faible présente.
