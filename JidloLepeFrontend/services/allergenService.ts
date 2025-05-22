// /services/allergenService.ts
import { db } from '@/constants/firebaseConfig';
import { collection, getDocs, doc, setDoc, getDoc } from 'firebase/firestore';

export const fetchAllergens = async () => {
    try {
        const querySnapshot = await getDocs(collection(db, 'allergens'));
        const allergenData: any = {};
        querySnapshot.forEach(doc => {
            allergenData[doc.id] = doc.data().allergens;
        });
        return allergenData;
    } catch (error) {
        throw new Error('Nelze načíst alergeny.');
    }
};

export const fetchUserAllergens = async (userId: string) => {
    try {
        const docRef = doc(db, 'users', userId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            const userData = docSnap.data();
            return userData?.allergens || [];
        }
        return [];
    } catch (error) {
        throw new Error('Nelze načíst alergeny uživatele.');
    }
};

export const saveUserAllergens = async (userId: string, selectedAllergens: string[]) => {
    try {
        await setDoc(doc(db, 'users', userId), {
            allergens: selectedAllergens,
        }, { merge: true });
    } catch (error) {
        throw new Error('Nepodařilo se uložit alergeny.');
    }
};
