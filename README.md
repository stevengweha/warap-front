# WA-RAP

Application mobile Expo/React Native pour la recherche et la gestion d’emplois dans le secteur formel et informel, pensée pour l’Afrique.

---

## Contexte & Idée

Dans de nombreux pays africains, le marché du travail est marqué par une forte dualité :  
- **Secteur formel** : entreprises structurées, offres d’emploi classiques, accès souvent limité à une minorité.
- **Secteur informel** : petits métiers, services à la personne, missions ponctuelles, bouche-à-oreille, réseaux sociaux, etc.

La majorité des actifs africains travaillent dans l’informel, souvent sans visibilité, sans accès facile à des offres fiables, ni possibilité de valoriser leur expérience.  
WA-RAP veut répondre à ce défi :  
- **Connecter** les chercheurs d’emploi et les recruteurs, quel que soit le secteur.
- **Valoriser** les compétences et parcours, même informels.
- **Fluidifier** la mise en relation, la gestion des candidatures et la communication.

L’application cible en priorité les pays d’Afrique francophone (Sénégal, Côte d’Ivoire, Bénin, Burkina Faso, Cameroun, Togo, Mali, Niger, RDC, etc.), mais peut être adaptée à tout contexte africain où l’informel est majoritaire.

---

## Présentation

WA-RAP est une plateforme mobile qui facilite la recherche d’emploi et la mise en relation entre travailleurs et recruteurs, aussi bien dans le secteur **formel** (entreprises, PME, administrations) que dans le secteur **informel** (petits boulots, services, missions ponctuelles, artisanat, etc.).

Elle permet de :
- Consulter et postuler à des offres d’emploi adaptées à tous profils.
- Poster des offres (pour les recruteurs, particuliers ou entreprises).
- Gérer ses candidatures et son historique de missions.
- Discuter via une messagerie intégrée, même sans CV classique.

---

## Fonctionnalités

- **Authentification** : Inscription, connexion, gestion des rôles (chercheur, posteur, admin).
- **Offres d’emploi** : Recherche, consultation, candidature, publication.
- **Candidatures** : Suivi des candidatures, historique, filtres par statut.
- **Messagerie** : Chat en temps réel entre utilisateurs (Socket.io).
- **Historique** : Visualisation des missions terminées.
- **Navigation fluide** : Onglets, boutons flottants, modales, etc.

---

## Installation & Lancement

### Prérequis

- Node.js >= 16.x
- npm >= 8.x
- [Expo CLI](https://docs.expo.dev/get-started/installation/)
- Un backend WA-RAP fonctionnel (API REST, Socket.io)

### Installation

```bash
npm install
```

### Lancement

```bash
npx expo start
```

- Scanner le QR code avec Expo Go (Android/iOS) ou ouvrir dans un émulateur.
- L’application se connecte par défaut à l’API sur `http://192.168.1.115:5001` (modifiez cette adresse dans les fichiers si besoin).

---

## Structure du projet

```
WA-RAP/
├── app/
│   ├── auth/           # Authentification (login, register, etc.)
│   ├── Jobs/           # Gestion des offres et candidatures
│   ├── messages/       # Messagerie (chat, liste des messages)
│   ├── components/     # Composants réutilisables (JobHistory, BottomTabBar, etc.)
│   ├── index.tsx       # Page d’accueil (connexion)
│   └── ...             # Autres pages/features
├── assets/             # Images, icônes, etc.
├── package.json
└── README.md
```

---

## Navigation

- **Accueil** : Page de connexion.
- **Inscription** : `/auth/register`
- **Accueil utilisateur** : `/Travailleur/home-user`
- **Accueil recruteur** : `/offreur/home-offer`
- **Dashboard admin** : `/Admin/dashboard`
- **Candidatures & historique** : `/Jobs/ManageJob`
- **Messagerie** : `/messages/smslist` et `/messages/chat`
- **Historique** : Accessible via bouton flottant ou onglet dans la page candidatures.

---

## Sécurité & bonnes pratiques

- **Validation des entrées** : Les formulaires vérifient les champs pour éviter les injections et erreurs.
- **Stockage sécurisé** : Les infos utilisateur sont stockées dans `AsyncStorage`.
- **Navigation protégée** : Redirection automatique selon le rôle de l’utilisateur.
- **API** : Toutes les requêtes sont faites vers le backend WA-RAP (voir adresse IP dans le code).

---

## Développement

- **Technos principales** : React Native, Expo, TypeScript, Socket.io (client), REST API.
- **UI** : StyleSheet natif, composants personnalisés, design mobile-first.
- **Hot reload** : Modifiez les fichiers dans `app/` et voyez les changements en temps réel.
- **Ajout de fonctionnalités** : Créez de nouveaux fichiers dans `app/` ou `components/` selon la logique.

---

## Ressources utiles

- [Expo documentation](https://docs.expo.dev/)
- [React Native documentation](https://reactnative.dev/)
- [Socket.io documentation](https://socket.io/docs/v4/client-api/)
- [AsyncStorage](https://react-native-async-storage.github.io/async-storage/docs/install/)
- [React Navigation](https://reactnavigation.org/)

---

## Communauté

- [Expo sur GitHub](https://github.com/expo/expo)
- [Discord Expo](https://chat.expo.dev)
- [Stack Overflow](https://stackoverflow.com/questions/tagged/expo)

---

## Astuces

- Pour changer l’API, modifiez l’URL dans les fichiers concernés (`fetch(...)`).
- Pour réinitialiser le projet :
  ```bash
  npm run reset-project
  ```
- Pour ajouter une nouvelle page, créez un fichier dans `app/` et il sera automatiquement routé.

---

**Contactez le développeur principal pour toute question ou suggestion.**
