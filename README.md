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

## Fin de mandat
Administration → Mandats → **Contrôle de clôture** : liste les études non rattachées, à compléter, sans montant, trop-perçues, non soldées, les factures en attente ou orphelines et les prospects de membres inactifs, avec corrections groupées. Puis « Clôturer le mandat » et « Ouvrir le mandat suivant ».

## Données de démonstration
Administration → Paramètres (Super Admin) : ajoute/supprime des données fictives (`demo: true`, préfixe « [Démo] »). À supprimer avant la clôture réelle.

## HT / TVA / TTC
Les factures stockent `montant_ht`, `taux_tva`, `montant_tva`, `montant_ttc`. Les études sont en HT ; l'encaissé est calculé en HT depuis les factures encaissées. Une facture dont le HT dépasse le reste à facturer est refusée.

## Journal des modifications et montant figé
- Collection `journal` : qui, quand, avant → après, motif. Alimentée par les études (infos, phases, avenants, assignations, lien coupé), les factures et les régularisations de compta. Affichée dans le panneau d'une étude (« Historique des modifications »).
- Le montant HT d'une étude signée ne se modifie qu'avec un motif obligatoire.
- Tant que le lien avec la prospection est actif et que l'étude n'a pas de phases chiffrées, le montant saisi en prospection met l'étude à jour.
- « Couper le lien » dans une étude fige le montant du prospect (`montant_fige`) : il n'est plus modifiable depuis « Mes prospects », « Après RDV » ou « Enregistrer une action ».
