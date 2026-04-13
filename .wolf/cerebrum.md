# Cerebrum

> OpenWolf's learning memory. Updated automatically as the AI learns from interactions.
> Do not edit manually unless correcting an error.
> Last updated: 2026-04-13

## User Preferences

<!-- How the user likes things done. Code style, tools, patterns, communication. -->

## Key Learnings

- **Project:** gpa-ng-workspace
- **Description:** Libreria UI condivisa per le applicazioni GPA. Fornisce layout, componenti, gestione token/ambiente, routing pre-configurati, temi Angular Material 3 e utility Tailwind CSS v4.

## Do-Not-Repeat

<!-- Mistakes made and corrected. Each entry prevents the same mistake recurring. -->
<!-- Format: [YYYY-MM-DD] Description of what went wrong and what to do instead. -->

- [2026-04-13] **MenuGuard: route con parametri dinamici (:id) non matchate.** Il guard confrontava solo `state.url` (con il valore reale, es. `/items/edit/123`) contro `allowedEndpoints` (che contiene il template, es. `/items/edit/:id`). Fix: aggiunto `getTemplateUrl()` che ricostruisce il path template dall'`ActivatedRouteSnapshot` e controlla anche quello.

## Decision Log

<!-- Significant technical decisions with rationale. Why X was chosen over Y. -->
