# Déploiement Firebase — Pierre et Jean Ministries

## 1. Préparer le projet Firebase (une seule fois)

1. Allez sur https://console.firebase.google.com
2. Créez un projet (ou utilisez votre projet existant `programmation-culte`)
3. **Firestore** : menu Build > Firestore Database > Créer une base de données (mode production)
4. **Authentication** : menu Build > Authentication > Commencer
   - Activez « Adresse e-mail/Mot de passe »
   - Onglet Users > Add user : créez votre compte administrateur (ex. admin@pjministries.com + mot de passe)
   - (Optionnel) Activez aussi « Google » pour le bouton de connexion Google
5. **Application Web** : Paramètres du projet (roue dentée) > Vos applications > icône </> (Web)
   - Donnez un nom (ex. « programmation-culte-web »)
   - Copiez l'objet `firebaseConfig` affiché

## 2. Configurer le code

1. Ouvrez `src/lib/firebase.ts`
2. Remplacez les valeurs `VOTRE_...` par celles de votre firebaseConfig
3. Si votre projet Firebase a un autre identifiant que `programmation-culte`,
   modifiez-le aussi dans `.firebaserc`

## 3. Déployer

```bash
npm install
npm install -g firebase-tools     # une seule fois
firebase login                    # une seule fois
npx vite build
firebase deploy
```

Votre application sera en ligne sur :
- https://VOTRE_PROJET.web.app
- https://VOTRE_PROJET.firebaseapp.com

## Notes

- Les collections Firestore utilisées sont `programmes` et `membres`
  (modifiables dans `src/lib/firebase.ts`, constante COLLECTIONS)
- Les règles de sécurité (`firestore.rules`) sont déployées automatiquement :
  lecture publique, écriture réservée aux comptes connectés
- Pour mettre à jour le site après une modification :
  `npx vite build && firebase deploy --only hosting`
