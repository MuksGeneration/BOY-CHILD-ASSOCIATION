import { useEffect, useState } from 'react';
import { firebaseService } from '../lib/firebase/firebase';
import { mockStore } from '../lib/firebase/mockStore';
import { UserRole } from '../types';

export function useStoreTick(): number {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    return mockStore.subscribe(() => setTick((t) => t + 1));
  }, []);
  return tick;
}

export function usePublicCatalog(role?: UserRole): number {
  const tick = useStoreTick();
  useEffect(() => {
    return firebaseService.subscribePublicCatalog(role);
  }, [role]);
  return tick;
}

export function useMemberData(uid?: string, role?: UserRole): number {
  const tick = useStoreTick();
  useEffect(() => {
    if (!uid || !role) return;
    return firebaseService.subscribeMemberData(uid, role);
  }, [uid, role]);
  return tick;
}

export function useMentorData(uid?: string): number {
  const tick = useStoreTick();
  useEffect(() => {
    if (!uid) return;
    return firebaseService.subscribeMentorData(uid);
  }, [uid]);
  return tick;
}

export function usePartnerData(uid?: string): number {
  const tick = useStoreTick();
  useEffect(() => {
    if (!uid) return;
    return firebaseService.subscribePartnerData(uid);
  }, [uid]);
  return tick;
}

export function useCoordinatorData(role?: UserRole): number {
  const tick = useStoreTick();
  useEffect(() => {
    if (role !== 'coordinator' && role !== 'admin') return;
    return firebaseService.subscribeCoordinatorData(role);
  }, [role]);
  return tick;
}

export function useSafeguardingData(hasClearance: boolean): number {
  const tick = useStoreTick();
  useEffect(() => {
    if (!hasClearance) return;
    return firebaseService.subscribeSafeguardingData(hasClearance);
  }, [hasClearance]);
  return tick;
}

export function useLmsData(uid?: string, role?: UserRole, instructorAuthorized?: boolean): number {
  const tick = useStoreTick();
  useEffect(() => {
    return firebaseService.subscribeLmsData(uid, role, instructorAuthorized);
  }, [uid, role, instructorAuthorized]);
  return tick;
}

export function useCourseWorkspaceData(courseId?: string, uid?: string, role?: UserRole): number {
  const tick = useStoreTick();
  useEffect(() => {
    if (!courseId) return;
    return firebaseService.subscribeCourseWorkspace(courseId, uid, role);
  }, [courseId, uid, role]);
  return tick;
}
