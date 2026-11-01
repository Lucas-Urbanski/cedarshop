"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

import type { YardData } from "@/types/yard";
import {
  initialYardData,
  newYardId,
  yardStorageKey,
} from "@/utils/yardData";

interface YardContextValue {
  data: YardData;
  ready: boolean;
  notice: string;
  update: (
    change: (current: YardData) => YardData,
    message: string,
  ) => boolean;
}

const YardContext = createContext<YardContextValue | null>(null);

export function YardProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState(initialYardData);
  const [ready, setReady] = useState(false);
  const [notice, setNotice] = useState("");

  // Restore the user's demo changes when the workspace opens.
  useEffect(() => {
    try {
      const saved = localStorage.getItem(yardStorageKey);

      if (saved) {
        const parsed = JSON.parse(saved) as YardData;

        if (
          parsed.version !== 1 ||
          !Array.isArray(parsed.inventory) ||
          !Array.isArray(parsed.orders) ||
          !Array.isArray(parsed.losses) ||
          !Array.isArray(parsed.activity)
        ) {
          throw new Error("Invalid data");
        }

        setData(parsed);
      }
    } catch {
      setNotice(
        "Saved demo data could not be read. Sample records are shown; new saves will replace the unreadable data.",
      );
    }

    setReady(true);
  }, []);

  function update(
    change: (current: YardData) => YardData,
    message: string,
  ) {
    if (!ready) return false;

    const next = change(data);

    next.activity = [
      {
        id: newYardId("ACT"),
        text: message,
        at: new Date().toISOString(),
      },
      ...next.activity,
    ].slice(0, 30);

    try {
      localStorage.setItem(yardStorageKey, JSON.stringify(next));

      setData(next);
      setNotice(`${message} Saved on this device.`);

      return true;
    } catch {
      setNotice(
        "Could not save. Device storage may be full or disabled. Your change has not been applied; try a smaller photo.",
      );

      return false;
    }
  }

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