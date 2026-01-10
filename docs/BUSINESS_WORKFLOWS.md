# 🔄 Flux Métier

## 📦 Processus Commande → Livraison

### 1. Réception Commande
```
Client → API POST /api/orders → Base de données
```
- Validation des données
- Assignation statut "pending"

### 2. Assignation Livreur
```
Dispatcher → Dashboard → API PUT /api/orders/:id
```
- Sélection du livreur disponible (deliverer_id dans body)
- Création/Mise à jour tournée
- Notification push livreur (prévu)

### 3. Livraison en Cours
```
Livreur (App Mobile) → GPS tracking → API PUT /api/deliveries/:id
```
- Mise à jour position GPS (prévu)
- Changement statut livraison (status dans body)
- Communication client (prévu)

### 4. Finalisation
```
Livreur → API PUT /api/orders/:id → Dashboard
```
- Confirmation livraison (status: 'completed' dans body)
- Mise à jour stocks
- Analytics calculés

## 🎯 Points Clés
- **Temps réel** : GPS et notifications
- **Traçabilité** : Chaque étape loggée
- **Sécurité** : Validation à chaque étape
- **Performance** : Optimisation des tournées