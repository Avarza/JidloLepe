import { firestore } from '@/lib/firebase'; // Importuj inicializaci Firestore z firebase
import { doc, getDoc, setDoc, collection, query, where, getDocs } from 'firebase/firestore';

// Funkce pro načítání alergií uživatele z Firestore
export const loadAllergiesFromFirestore = async (userId: string): Promise<string[]> => {
    try {
        const userRef = doc(firestore, 'users', userId); // Cesta k dokumentu uživatele ve Firestore
        const userDoc = await getDoc(userRef);

        if (userDoc.exists()) {
            const userData = userDoc.data();
            return userData?.allergies || []; // Vrátí alergie, pokud existují
        } else {
            console.log('Dokument uživatele neexistuje');
            return [];
        }
    } catch (error) {
        console.error('Chyba při načítání alergií:', error);
        return [];
    }
};

// Funkce pro porovnání alergií uživatele s alergeny produktu
export const compareAllergens = (productAllergens: string[], userAllergies: string[]): string[] => {
    return productAllergens.filter(allergen => userAllergies.includes(allergen));
};

// Funkce pro přidání alergií uživatele do Firestore (pokud je nemá)
export const addAllergiesToFirestore = async (userId: string, allergies: string[]): Promise<void> => {
    try {
        const userRef = doc(firestore, 'users', userId); // Cesta k dokumentu uživatele
        await setDoc(userRef, { allergies }, { merge: true }); // Uložení alergií do Firestore
    } catch (error) {
        console.error('Chyba při přidávání alergií do Firestore:', error);
    }
};

// Funkce pro načítání složení produktu z Firestore (například podle ID produktu)
export const getProductIngredientsFromFirestore = async (productId: string): Promise<string[]> => {
    try {
        const productRef = doc(firestore, 'products', productId);
        const productDoc = await getDoc(productRef);

        if (productDoc.exists()) {
            const productData = productDoc.data();
            return productData?.ingredients || []; // Vrátí složení produktu
        } else {
            console.log('Produkt nenalezen');
            return [];
        }
    } catch (error) {
        console.error('Chyba při načítání složení produktu:', error);
        return [];
    }
};
// Funkce pro uložení alergií uživatele do Firestore
export const saveAllergiesToFirestore = async (userId: string, allergies: string[]): Promise<void> => {
    try {
        const userRef = doc(firestore, 'users', userId); // Odkaz na dokument uživatele ve Firestore
        await setDoc(userRef, { allergies }, { merge: true }); // Uložení alergií do dokumentu
        console.log('Alergie byly uloženy do Firestore');
    } catch (error) {
        console.error('Chyba při ukládání alergií:', error);
    }
};