import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, doc, setDoc, getDoc, getDocs, collection, query, where, deleteDoc } from 'firebase/firestore';
import { CardProfile } from '../types.js';

// Firebase configuration from auto-provisioned project
const firebaseConfig = {
  projectId: "hardy-diorama-njlsj",
  appId: "1:445494552671:web:577c81c63b3575f41153ea",
  apiKey: "AIzaSyAvjyq5UfqqQ2bf6S3MMcGQzN7YeAnjIq0",
  authDomain: "hardy-diorama-njlsj.firebaseapp.com",
  storageBucket: "hardy-diorama-njlsj.firebasestorage.app",
  messagingSenderId: "445494552671",
};

const databaseId = "ai-studio-cardflowproaidig-243f4e56-977b-447a-9291-02ce721e4d19";

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const db = getFirestore(app, databaseId);

/**
 * Saves a card profile to Firebase Firestore database so it is accessible globally from any mobile or desktop web browser!
 */
export async function saveCardToFirestore(card: CardProfile): Promise<boolean> {
  try {
    const slugKey = (card.slug || card.name || 'card')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    const cardRef = doc(db, 'cards', slugKey);
    const cardData = { ...card, slug: slugKey, updatedAt: new Date().toISOString() };
    
    await setDoc(cardRef, cardData, { merge: true });
    console.log(`[Firestore] Successfully saved card '${slugKey}' to cloud database!`);
    return true;
  } catch (err) {
    console.warn('[Firestore] Error saving card to cloud database:', err);
    return false;
  }
}

/**
 * Retrieves a card profile from Firebase Firestore database by slug.
 */
export async function getCardFromFirestore(slug: string): Promise<CardProfile | null> {
  try {
    const cleanSlug = slug.toLowerCase().trim();
    if (!cleanSlug) return null;

    // Direct doc lookup
    const cardRef = doc(db, 'cards', cleanSlug);
    const docSnap = await getDoc(cardRef);

    if (docSnap.exists()) {
      return docSnap.data() as CardProfile;
    }

    // Exact query by slug field
    const cardsQuery = query(collection(db, 'cards'), where('slug', '==', cleanSlug));
    const querySnap = await getDocs(cardsQuery);
    if (!querySnap.empty) {
      return querySnap.docs[0].data() as CardProfile;
    }

    // Fallback: search all Firestore docs for prefix / partial match
    const allDocs = await getDocs(collection(db, 'cards'));
    if (!allDocs.empty) {
      for (const d of allDocs.docs) {
        const c = d.data() as CardProfile;
        if (c && c.slug) {
          const s = c.slug.toLowerCase().trim();
          if (
            s === cleanSlug ||
            cleanSlug.startsWith(s) ||
            s.startsWith(cleanSlug) ||
            cleanSlug.includes(s) ||
            s.includes(cleanSlug)
          ) {
            return c;
          }
        }
      }
    }
  } catch (err) {
    console.warn('[Firestore] Error getting card from cloud database:', err);
  }
  return null;
}

/**
 * Fetches all cards stored in Firebase Firestore database.
 */
export async function getAllCardsFromFirestore(): Promise<CardProfile[]> {
  try {
    const querySnap = await getDocs(collection(db, 'cards'));
    const cards: CardProfile[] = [];
    querySnap.forEach((doc) => {
      cards.push(doc.data() as CardProfile);
    });
    return cards;
  } catch (err) {
    console.warn('[Firestore] Error fetching all cards from cloud database:', err);
    return [];
  }
}

/**
 * Deletes a card profile from Firebase Firestore database.
 */
export async function deleteCardFromFirestore(slugOrId: string): Promise<boolean> {
  try {
    const cleanSlug = slugOrId.toLowerCase().trim();
    if (!cleanSlug) return false;

    // 1. Delete direct document by slug
    const cardRef = doc(db, 'cards', cleanSlug);
    await deleteDoc(cardRef);

    // 2. Query matching slug or id
    const qSlug = query(collection(db, 'cards'), where('slug', '==', cleanSlug));
    const snapSlug = await getDocs(qSlug);
    for (const d of snapSlug.docs) {
      await deleteDoc(d.ref);
    }

    const qId = query(collection(db, 'cards'), where('id', '==', slugOrId));
    const snapId = await getDocs(qId);
    for (const d of snapId.docs) {
      await deleteDoc(d.ref);
    }

    console.log(`[Firestore] Deleted card '${cleanSlug}' from cloud database`);
    return true;
  } catch (err) {
    console.warn('[Firestore] Error deleting card from cloud database:', err);
    return false;
  }
}
