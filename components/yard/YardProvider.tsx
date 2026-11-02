"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  collection,
  doc,
  onSnapshot,
  writeBatch,
  type DocumentData,
} from "firebase/firestore";

import type { ChildrenProps, YardContextValue } from "@/types/types";
import type { YardData } from "@/types/yard";
import type {
  InventoryRecord,
  YardActivityRecord,
  YardLossRecord,
  YardWorkOrderRecord,
} from "@/types/business";
import { auth, db } from "@/utils/firebase";

const emptyYardData: YardData = {
  version: 1,
  inventory: [],
  orders: [],
  losses: [],
  activity: [],
};

function withoutId<T extends { id: string }>(record: T): DocumentData {
  const { id, ...data } = record;
  return data;
}

function changedRecords<T extends { id: string }>(
  before: T[],
  after: T[],
) {
  const previous = new Map(before.map((record) => [record.id, record]));
  return after.filter(
    (record) =>
      JSON.stringify(previous.get(record.id)) !== JSON.stringify(record),
  );
}

const YardContext = createContext<YardContextValue | null>(null);

export function YardProvider({ children }: ChildrenProps) {
  const [data, setData] = useState(emptyYardData);
  const [ready, setReady] = useState(false);
  const [notice, setNotice] = useState("");
  const dataRef = useRef(data);
  const updateQueue = useRef(Promise.resolve(true));

  useEffect(() => {
    let active = true;
    let loadedCollections = 0;
    const markLoaded = () => {
      loadedCollections += 1;
      if (active && loadedCollections === 4) setReady(true);
    };
    const handleError = (name: string, error: Error) => {
      console.error(`Could not load yard ${name}.`, error);
      if (active) {
        setNotice(`Could not load yard ${name}. Check your connection and try again.`);
        setReady(true);
      }
    };

    const unsubscribers = [
      onSnapshot(
        collection(db, "inventory"),
        (snapshot) => {
          if (!active) return;
          const inventory = snapshot.docs.map(
            (entry) => ({ id: entry.id, ...entry.data() }) as InventoryRecord,
          );
          const next = { ...dataRef.current, inventory };
          dataRef.current = next;
          setData(next);
          markLoaded();
        },
        (error) => handleError("inventory", error),
      ),
      onSnapshot(
        collection(db, "yardWorkOrders"),
        (snapshot) => {
          if (!active) return;
          const orders = snapshot.docs.map(
            (entry) =>
              ({ id: entry.id, ...entry.data() }) as YardWorkOrderRecord,
          );
          const next = { ...dataRef.current, orders };
          dataRef.current = next;
          setData(next);
          markLoaded();
        },
        (error) => handleError("work orders", error),
      ),
      onSnapshot(
        collection(db, "yardLossReports"),
        (snapshot) => {
          if (!active) return;
          const losses = snapshot.docs.map(
            (entry) =>
              ({ id: entry.id, ...entry.data() }) as YardLossRecord,
          );
          const next = { ...dataRef.current, losses };
          dataRef.current = next;
          setData(next);
          markLoaded();
        },
        (error) => handleError("loss reports", error),
      ),
      onSnapshot(
        collection(db, "yardActivity"),
        (snapshot) => {
          if (!active) return;
          const activity = snapshot.docs
            .map(
              (entry) =>
                ({ id: entry.id, ...entry.data() }) as YardActivityRecord,
            )
            .sort((a, b) => b.at.localeCompare(a.at))
            .slice(0, 30)
            .map(({ id, text, at }) => ({ id, text, at }));
          const next = { ...dataRef.current, activity };
          dataRef.current = next;
          setData(next);
          markLoaded();
        },
        (error) => handleError("activity", error),
      ),
    ];

    return () => {
      active = false;
      unsubscribers.forEach((unsubscribe) => unsubscribe());
    };
  }, []);

  const update = useCallback(
    (
      change: (current: YardData) => YardData,
      message: string,
    ): Promise<boolean> => {
      const task = updateQueue.current.then(async () => {
        const user = auth.currentUser;
        if (!user || !ready) {
          setNotice("Wait for the yard workspace to finish loading, then try again.");
          return false;
        }

        const previous = dataRef.current;
        const next = change(previous);
        const activity: YardActivityRecord = {
          id: crypto.randomUUID(),
          text: message,
          at: new Date().toISOString(),
          createdBy: user.uid,
        };
        const batch = writeBatch(db);

        changedRecords(previous.inventory, next.inventory).forEach((item) => {
          batch.set(doc(db, "inventory", item.id), withoutId(item), {
            merge: true,
          });
        });
        changedRecords(previous.orders, next.orders).forEach((item) => {
          batch.set(
            doc(db, "yardWorkOrders", item.id),
            {
              ...withoutId(item),
              createdBy:
                previous.orders.find((order) => order.id === item.id)?.createdBy ??
                user.uid,
              updatedAt: new Date().toISOString(),
            },
            {
            merge: true,
            },
          );
        });
        changedRecords(previous.losses, next.losses).forEach((item) => {
          batch.set(
            doc(db, "yardLossReports", item.id),
            {
              ...withoutId(item),
              createdBy:
                previous.losses.find((loss) => loss.id === item.id)?.createdBy ??
                user.uid,
            },
            { merge: true },
          );
        });
        batch.set(doc(db, "yardActivity", activity.id), withoutId(activity));

        try {
          await batch.commit();
          setNotice(`${message} Saved.`);
          return true;
        } catch (error) {
          console.error("Could not save yard changes.", error);
          setNotice("Your change could not be saved. Check your connection and try again.");
          return false;
        }
      });

      updateQueue.current = task.catch((error: unknown) => {
        console.error("Could not save yard changes.", error);
        setNotice("Your change could not be saved. Check your connection and try again.");
        return false;
      });

      return task;
    },
    [ready],
  );

  return (
    <YardContext.Provider value={{ data, ready, notice, update }}>
      {children}
    </YardContext.Provider>
  );
}

export function useYard() {
  const context = useContext(YardContext);

  if (!context) {
    throw new Error("YardProvider is required");
  }

  return context;
}
