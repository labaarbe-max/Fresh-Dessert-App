# 📋 Fresh Dessert App - Analyse de Projet

> **Instructions :** Répondez à chaque question en remplaçant `[ VOTRE RÉPONSE ICI ]` par votre réponse.

---

## 🎯 Vision du Projet

**Projet :** Application complète de livraison de desserts

**3 Applications :**
1. **App Mobile Client** → Les clients commandent des desserts
2. **App Entreprise (Back-office)** → Gestion des commandes et assignation aux livreurs
3. **App Mobile Livreur** → Les livreurs reçoivent et gèrent leurs livraisons

---

## 1️⃣ Architecture & Périmètre

### Q1 : Rôle du projet Next.js actuel

Le projet Next.js qu'on est en train de créer, c'est pour quoi exactement ?

**Options :**
- A) Le backend API (qui servira les 3 apps)
- B) L'app entreprise (back-office web)
- C) Les deux (backend + interface web)

**Votre réponse :** [ VOTRE RÉPONSE ICI ]
Je ne sais pas, car je ne sais pas comment procéder, j'aimerais le faire selon les bonnes pratiques et de manière professionnelle. Il faut que ce soit le plus sécurisé possible.
---

### Q2 : Transition depuis Express

Voulez-vous **remplacer complètement** votre backend Express actuel, ou **coexister** avec lui pendant la transition ?

**Votre réponse :** [ VOTRE RÉPONSE ICI ]
Ce que j'ai créer en JS, Sous express, c'est uniquement pour récupérer les commandes UberEats, et les envoyer à Trello. Car il me fallait un moyen de récupérer les commandes UberEats, et les stocker dans un endroit où les livreurs ont accès, et où il est simple de déplacer les commandes pour avoir une vision sur ce que fait le livreur.

## 2️⃣ Applications Mobiles

### Q3 : Technologie mobile

Pour les apps mobiles (client + livreur), quelle technologie envisagez-vous ?

**Options :**
- React Native (JavaScript, partage du code avec Next.js)
- Flutter (Dart)
- Native (Swift pour iOS / Kotlin pour Android)
- Pas encore décidé

**Votre réponse :** [ VOTRE RÉPONSE ICI ]
Je ne sais pas encore, j'ai quelques connaissances en REACT, Express, mais je sais que ce n'est pas suffisant et que ce n'est pas optimiser pour les apps mobiles. J'ai vu que Flutter est une bonne option, mais je ne sais pas encore si c'est la meilleure. D'autant que Flutter est un peu plus difficile à apprendre et je n'en ai jamais fait.
---

### Q4 : État actuel des apps mobiles

Ces apps mobiles existent-elles déjà ou c'est à créer de zéro ?

**Votre réponse :** [ VOTRE RÉPONSE ICI ]
Non, elles n'existent pas encore. C'est à créer de zéro.
---

## 3️⃣ Fonctionnalités & Workflow

### Q5 : Workflow des commandes

Est-ce que ce workflow est correct ?

```
1. Client (app mobile) passe commande
   ↓
2. Entreprise (back-office) reçoit la commande
   ↓
3. Entreprise assigne la commande à un livreur
   ↓
4. Livreur (app mobile) reçoit une notification
   ↓
5. Livreur livre la commande
   ↓
6. Statut mis à jour en temps réel
```

**Votre réponse :** [ OUI / NON / PRÉCISIONS ]
De manière très simplifié, oui. Mais il manque énormément de fonctionnalités dans ce workflow. Que ce soit coté client, coté livreurs, coté Dispatchers.
---

### Q6 : Intégration Trello

Concernant Trello :
- Voulez-vous **garder** Trello dans le nouveau système ?
- Ou le **remplacer** par une gestion interne ?

**Votre réponse :** [ VOTRE RÉPONSE ICI ]
Une gestion interne serait plus pratique, et plus rapide. Trello n'est pas adapté pour gérer des commandes, et des livreurs. Il rempli son rôle pour le moment, mais c'est une solution de dépannage.
---

### Q7 : Extension Chrome UberEats

L'extension Chrome pour extraire les commandes UberEats :
- Doit-elle continuer à fonctionner avec le nouveau système ?
- Ou vous voulez seulement gérer les commandes de votre propre app client ?

**Votre réponse :** [ VOTRE RÉPONSE ICI ]
Elle doit continuer à fonctionner avec le nouveau système. Car UberEats reste un moyen d'acquérir des commandes.
---

## 4️⃣ Gestion des Stocks & Tournées

### Q8 : Système de stocks

D'après votre documentation, vous avez un système de tournées et de stocks.

**Questions :**
- Les livreurs partent avec un stock fixe en début de tournée ?
- Ils peuvent prendre des commandes uniquement pour les produits qu'ils ont ?
- Comment gérez-vous les ruptures de stock ?
- Le client voit-il les produits disponibles en temps réel selon les stocks ?

**Votre réponse :** [ VOTRE RÉPONSE ICI ]
- Oui, les livreurs partent avec un stock fixe en début de tournée. Mais il est possible que des livreurs se croisent pour échanger des produits si besoin.
- Non, le client voit les produits disponibles en temps réel selon les stocks. Mais il faudrait pouvoir implémenter un système de stock dynamique.
- Pour le moment, je le fait manuellement. Au téléphone avec les livreurs, c'est d'ailleurs l'un de mes plus gros point de douleur.
- Oui, sur ubereats, le client voit les produits que je met en stock, mais je peux les enlever du stock pour qu'il ne le voit plus. Sauf que je ne peux pas tout le temps enlever du stock, car si j'ai un autre livreur pas loin, je peux l'appeler pour qu'il prenne en charge la commande à la place du livreur qui devais y être attribué. Je n'aime pas cette méthode mais je ne vois pas d'autre moyen. Si tu as des idées, je suis ouvert.
---

## 5️⃣ Paiement & Authentification

### Q9 : Système de paiement

**Questions :**
- Les clients paient dans l'app mobile ?
- Quel système de paiement (Stripe, PayPal, autre) ?
- Ou paiement à la livraison (cash/carte) ?

**Votre réponse :** [ VOTRE RÉPONSE ICI ]
Actuellement, le client paie sur UberEats, où en espèces et CB pour les commandes en directe (appels, sms).
Mais pour l'app mobile, j'aimerais laisser le choix au client. Il dois pouvoir choisir de payer soit sur l'app, soit en espèce où en CB. Le mieux serait qu'il paie sur l'app où en espèces.
---

### Q10 : Authentification & Rôles

**Questions :**
- Les clients doivent créer un compte ou commande en invité possible ?
- Les livreurs ont des comptes individuels avec login ?
- Système de rôles : admin, manager, livreur, client ?
- Authentification via email/password, Google, Facebook ?

**Votre réponse :** [ VOTRE RÉPONSE ICI ]
- Oui, le client est obliger de créer un compte pour pouvoir commander.
- Oui, j'aimerais que ce soit le cas.
- Oui, j'aimerais que ce soit le cas.
- Oui, j'aimerais que ce soit le cas.
---

## 6️⃣ Priorités & Planning

### Q11 : Priorité immédiate

Quelle est votre priorité immédiate pour commencer le développement ?

**Options :**
- A) Finir le backend API complet (tous les endpoints)
- B) Créer l'app mobile client d'abord
- C) Créer l'app entreprise (back-office web) d'abord
- D) Créer l'app mobile livreur d'abord

**Votre réponse :** [ VOTRE RÉPONSE ICI ]
Je ne sais pas ce qui serait le mieux.
---

### Q12 : Timeline

Avez-vous des deadlines ou c'est un projet personnel sans contrainte de temps ?

**Votre réponse :** [ VOTRE RÉPONSE ICI ]
Je n'ai pas de deadline, mais plus tôt ce sera fait, mieux se sera.
---

## 7️⃣ Fonctionnalités Supplémentaires

### Q13 : Fonctionnalités avancées

Souhaitez-vous intégrer dès le début :

- [ ] Notifications push (Firebase, OneSignal)
- [ ] Géolocalisation en temps réel des livreurs
- [ ] Chat client/livreur
- [ ] Système de notation (client note le livreur)
- [ ] Programme de fidélité / points
- [ ] Codes promo / réductions
- [ ] Historique des commandes client
- [ ] Statistiques / Dashboard analytics
- [ ] Multi-langues (FR/EN/autre)

**Cochez les fonctionnalités souhaitées et précisez :** [ VOTRE RÉPONSE ICI ]
- Oui
- Oui
- Oui, et les produits aussi
- Oui
- Oui
- Oui
- Oui
- Oui
- Oui
---

## 8️⃣ Questions Techniques

### Q14 : Hébergement & Déploiement

Où comptez-vous héberger l'application ?

**Options :**
- Vercel (gratuit pour Next.js)
- AWS / Google Cloud / Azure
- VPS personnel
- Pas encore décidé

**Votre réponse :** [ VOTRE RÉPONSE ICI ]
- pas encore décidé, c'est un projet très ambicieux, je ne m'y connais pas suffisament pour décider de cela.
---

### Q15 : Base de données

Pour la base de données MySQL :
- Hébergement local (développement) puis cloud (production) ?
- Quel service cloud (AWS RDS, PlanetScale, autre) ?
- Besoin de backups automatiques ?

**Votre réponse :** [ VOTRE RÉPONSE ICI ]
Je ne sais pas encore, mais je pense que c'est un projet très ambicieux, je ne m'y connais pas suffisament pour décider de cela.
---

## 📝 Notes & Précisions Supplémentaires

Ajoutez ici toute information supplémentaire importante pour le projet :

```
[ VOS NOTES ICI ]
```

---

## ✅ Prochaines Étapes

Une fois ce fichier complété, je pourrai :

1. **Définir l'architecture technique complète**
2. **Concevoir le schéma de base de données optimal**
3. **Planifier tous les endpoints API nécessaires**
4. **Établir un plan de développement progressif**
5. **Vous guider étape par étape dans la réalisation**

---

**Date de création :** 2026-01-05  
**Statut :** En attente de vos réponses
