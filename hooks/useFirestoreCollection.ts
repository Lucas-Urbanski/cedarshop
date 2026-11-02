"use client";

import { useEffect, useMemo, useState } from "react";
import {
  collection,
  onSnapshot,
  query,
  type DocumentData,
  type QueryConstraint,
} from "firebase/firestore";

import { db } from "@/utils/firebase";

const noConstraints: readonly QueryConstraint[] = [];

export interface FirestoreCollectionState<T> {
  items: T[];
  loading: boolean;
  error: string | null;
}

export default function useFirestoreCollection<T extends DocumentData>(
  collectionName: string,
  constraints: readonly QueryConstraint[] = noConstraints,
  enabled = true,
): FirestoreCollectionState<T & { id: string }> {
  const [items, setItems] = useState<(T & { id: string })[]>([]);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState<string | null>(null);
  const queryRef = useMemo(
    () => query(collection(db, collectionName), ...constraints),
    [collectionName, constraints],
  );

  useEffect(() => {
    if (!enabled) {
      setItems([]);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    return onSnapshot(
      queryRef,
      (snapshot) => {
        setItems(
          snapshot.docs.map(
            (document) =>
              ({ id: document.id, ...document.data() }) as T & {
                id: string;
              },
          ),
        );
        setLoading(false);
      },
      (caughtError) => {
        console.error(`Could not load ${collectionName}.`, caughtError);
        setError(`Could not load ${collectionName}. Please try again.`);
        setLoading(false);
      },
    );
  }, [collectionName, enabled, queryRef]);

  return { items, loading, error };
}
