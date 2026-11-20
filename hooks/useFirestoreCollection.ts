"use client";

import { useEffect, useMemo, useState } from "react";
import {
  collection,
  onSnapshot,
  query,
  type DocumentData,
  type Query,
  type QueryConstraint,
} from "firebase/firestore";

import { db } from "@/utils/firebase";
import type { FirestoreCollectionState, Identified } from "@/types/types";

const noConstraints: readonly QueryConstraint[] = [];

export default function useFirestoreCollection<T extends DocumentData>(
  collectionName: string,
  constraints: readonly QueryConstraint[] = noConstraints,
  enabled = true,
): FirestoreCollectionState<Identified<T>> {
  const [result, setResult] = useState<{
    query: Query;
    items: Identified<T>[];
  } | null>(null);
  const [failure, setFailure] = useState<{
    query: Query;
    message: string;
  } | null>(null);
  const queryRef = useMemo(
    () => query(collection(db, collectionName), ...constraints),
    [collectionName, constraints],
  );

  useEffect(() => {
    if (!enabled) return;

    return onSnapshot(
      queryRef,
      (snapshot) => {
        setResult({
          query: queryRef,
          items: snapshot.docs.map(
            (document) =>
              ({ id: document.id, ...document.data() }) as Identified<T>,
          ),
        });
        setFailure(null);
      },
      (caughtError) => {
        console.error(`Could not load ${collectionName}.`, caughtError);
        setFailure({
          query: queryRef,
          message: `Could not load ${collectionName}. Please try again.`,
        });
      },
    );
  }, [collectionName, enabled, queryRef]);

  // Results and errors are tagged with the query they belong to, so a filter
  // change never shows the previous query's rows.
  const items =
    enabled && result?.query === queryRef ? result.items : [];
  const error = failure?.query === queryRef ? failure.message : null;
  const loading = enabled && result?.query !== queryRef && error === null;

  return { items, loading, error };
}
