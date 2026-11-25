import {
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut,
    onAuthStateChanged
} from 'firebase/auth';

import type { User } from 'firebase/auth';

import { auth } from './firebase';
import { creerProfil } from './users.service';

const DOMAINE_INTERNE = 'refind.mg';

export interface InfosInscription {
    nom: string;
    prenom: string;
    telephone: string;
    adresse?: string;
}

// Un identifiant sans "@" (ex : "admin") correspond à un compte interne.
export const normaliserIdentifiant = (identifiant: string): string => {
    const valeur = identifiant.trim().toLowerCase();
    return valeur.includes('@') ? valeur : `${valeur}@${DOMAINE_INTERNE}`;
};

// CONNEXION
export const login = async (
    identifiant: string,
    password: string
): Promise<User> => {

    const userCredential = await signInWithEmailAndPassword(
        auth,
        normaliserIdentifiant(identifiant),
        password
    );

    return userCredential.user;
};

// INSCRIPTION
export const register = async (
    email: string,
    password: string,
    infos?: InfosInscription
): Promise<User> => {

    const userCredential = await createUserWithEmailAndPassword(
        auth,
        email.trim(),
        password
    );

    await creerProfil(userCredential.user.uid, {
        email: email.trim(),
        nom: infos?.nom?.trim() ?? '',
        prenom: infos?.prenom?.trim() ?? '',
        telephone: infos?.telephone?.trim() ?? '',
        adresse: infos?.adresse?.trim() ?? '',
    });

    return userCredential.user;
};

// DECONNEXION
export const logout = async (): Promise<void> => {
    await signOut(auth);
};

// SURVEILLANCE DE LA SESSION
export const observeAuthState = (
    callback: (user: User | null) => void
) => {
    return onAuthStateChanged(auth, callback);
};
