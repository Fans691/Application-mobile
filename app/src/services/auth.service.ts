import {
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut,
    onAuthStateChanged
} from 'firebase/auth';

import type { User } from 'firebase/auth';

import { auth } from './firebase';

// CONNEXION
export const login = async (
    email: string,
    password: string
): Promise<User> => {

    const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
    );

    return userCredential.user;
};

// INSCRIPTION
export const register = async (
    email: string,
    password: string
): Promise<User> => {

    const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
    );

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