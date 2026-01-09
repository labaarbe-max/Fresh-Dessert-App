# WORKFLOW GLOBALE DU WORKSPACE

## Workflow standard
1) **Analyse de la tâche**
   - Lire la demande ou le code existant
   - Identifier les fichiers/modules impactés

2) **Phase exécution (DeepSeek)**
   - Implémenter la feature ou modification
   - Vérifier sécurité et bonnes pratiques
   - Préparer livrables pour audit :
     - Code complet
     - Explication technique concise
     - Liste des fichiers impactés
     - Risques connus
     - Points à auditer par Claude

3) **Phase supervision (Claude)**
   - Auditer le travail fourni
   - Évaluer architecture, sécurité, scalabilité
   - Identifier dette technique ou mauvaises pratiques
   - Fournir rapport clair :
     - Ce qui va bien
     - Ce qui ne va pas et pourquoi
     - Recommandations / corrections
   - Valider ou bloquer décisions critiques

4) **Correction et finalisation (DeepSeek)**
   - Appliquer les recommandations de Claude
   - Expliquer toutes les modifications
   - Livrer la version finale
