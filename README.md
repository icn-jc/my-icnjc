# My-ICN-JC

Intranet d'ICN Junior Conseil — site statique (GitHub Pages) + Firebase (connexion Google et base Firestore `my-icnjc`).

## Structure

```
index.html          Accueil : alertes et indicateurs du mandat
prospection.html    CRM : vue CA, mes prospects, tous les prospects, après RDV
etudes.html         Études : phases JEH, frais de structure, taux intervenants, assignations, avenants
clients.html        Fiches clients, contacts, fiche personnalité
intervenants.html   Vivier d'intervenants, missions, notation interne
compta.html         Factures → encaissé des études, impayés, import SAGE
kpi.html            Indicateurs par mandat (calculés sur la période du mandat)
missions.html       Espace intervenant : missions, RM, questionnaire Sphinx
documents.html      Liens GDrive des RM et questionnaires
admin.html          Membres, accès externes, mandats, paramètres
assets/core.js      Socle commun : Firebase, connexion, droits par rôle, navigation, règles métier
assets/app.css      Feuille de style unique
```

## Ajouter une page

1. Copier une page existante (en-tête `<head>` identique).
2. Ajouter sa clé dans `ACCESS` (qui voit / qui modifie) et dans `NAV` (menu) de `assets/core.js`.
3. Dans la page : `App.start('cle', () => { ... })`.

Les clics passent par `data-action="nom"` + `onActions({ nom: el => ... })` : pas de `onclick` dans le HTML généré.

## Accès

- Adresse `@icnjuniorconseil.com` → document `users/{email}` (rôles cumulables dans `roles`).
- Autre adresse → document `whitelist_emails/{email}` (tuteur, commercial externe, intervenant, membre COS), géré dans Administration.
- Un intervenant dont l'email figure dans `intervenants` accède automatiquement à « Mes missions ».

Règles Firestore attendues : lecture/écriture pour tout utilisateur connecté (`request.auth != null`).
