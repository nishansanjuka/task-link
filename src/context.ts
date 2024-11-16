import { createContext } from "react";
import { AsyncContextValue } from "./types";

export const AsyncContext = createContext<AsyncContextValue | undefined>(
  undefined
);
AsyncContext.displayName = "AsyncContext";
