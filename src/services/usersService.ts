import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { isMockMode, getMockUserProfile, saveMockUserProfile } from "@/services/mockDb";

export interface UserProfile {
  id: string;
  name: string;
  role: "owner" | "worker";
  language?: string;
  stockThreshold?: number;
  productionStages?: string[];
  workerRoles?: string[];
}

export const createUserProfile = async (
  uid: string,
  name: string,
  role: "owner" | "worker"
): Promise<UserProfile> => {
  const profile: UserProfile = { id: uid, name, role };
  if (isMockMode()) {
    saveMockUserProfile(uid, profile);
    return profile;
  }
  await setDoc(doc(db, "Users", uid), profile);
  return profile;
};

export const getUserProfile = async (uid: string): Promise<UserProfile | null> => {
  if (isMockMode()) {
    return getMockUserProfile(uid);
  }
  const snap = await getDoc(doc(db, "Users", uid));
  if (snap.exists()) {
    return { ...snap.data(), id: uid } as UserProfile;
  }
  return null;
};

export const updateUserProfile = async (
  uid: string,
  data: any
): Promise<UserProfile> => {
  console.log("updateUserProfile called for:", uid, "data:", data);
  if (isMockMode()) {
    const profile = getMockUserProfile(uid);
    const updatedProfile = { ...profile, ...data };
    saveMockUserProfile(uid, updatedProfile);
    return updatedProfile;
  }
  const docRef = doc(db, "Users", uid);
  await setDoc(docRef, data, { merge: true });
  const snap = await getDoc(docRef);
  const result = { ...snap.data(), id: uid } as UserProfile;
  console.log("updateUserProfile result:", result);
  return result;
};

