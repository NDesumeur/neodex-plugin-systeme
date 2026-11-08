# Système

Un tableau de bord de ton PC en direct : processeur, mémoire, température, réseau, cœurs, programmes les plus gourmands en mémoire, disques et informations générales. Les mesures sont prises chaque seconde, et les courbes montrent les 5 dernières minutes.

*English version: [README.en.md](README.en.md)*

## Les quatre compteurs du haut

- **Processeur** : l'utilisation actuelle, en %, avec le nom du processeur et son nombre de cœurs logiques.
- **Mémoire** : la mémoire utilisée sur le total, en Go.
- **Réseau** : ce qui est reçu et envoyé en ce moment (o/s, Ko/s, Mo/s).
- **Température** : celle du capteur de la carte mère, quand Windows la donne. Sur beaucoup de PC, Windows la réserve aux administrateurs ; le plugin l'indique alors au lieu d'afficher une valeur.

## Les courbes

- **Processeur et mémoire** et **Réseau** (reçu, envoyé) sur les 5 dernières minutes, avec la moyenne sur la période.
- Passe la souris sur une courbe : un repère montre les valeurs à ce moment-là (« il y a 2 min 10 s »).

## Le détail

- **Cœurs du processeur** : une barre par cœur, et le nombre de cœurs au-dessus de 80 % (ou « aucun cœur saturé »).
- **Mémoire par programme** : les programmes qui utilisent le plus de mémoire, du plus gourmand au moins gourmand.
- **Disques** : l'espace libre sur le total pour chaque disque ; un disque plein à plus de 90 % est signalé en couleur.
- **Ce PC** : le nom du PC, la version de Windows, depuis combien de temps il est allumé, la mémoire utilisée par NeoDex et, sur un portable, la batterie et si elle charge.

Les mesures s'arrêtent dès que tu quittes l'onglet, pour ne rien consommer en arrière-plan.

## Données et synchronisation

Rien n'est enregistré ni synchronisé : tout est mesuré en direct.

## Installer

Dans NeoDex : **NeoStore → À découvrir → Système → Installer**.

Développer un plugin : voir le [SDK NeoDex](https://github.com/NDesumeur/neodex-sdk).
