import { ReactNode } from "react";

export type AsyncFunction<T> = () => Promise<T>;

export interface AsyncResult<T> {
  data: T | null;
  error: Error | null;
  isLoading: boolean;
}

export interface AsyncContextState {
  functions: Record<string, AsyncFunction<any>>;
  results: Record<string, AsyncResult<any>>;
}

export interface AsyncContextValue {
  assignFunction: <T>(key: string, asyncFunc: AsyncFunction<T>) => void;
  triggerFunction: <T>(key: string) => Promise<void>;
  getResult: <T>(key: string) => AsyncResult<T>;
  removeFunction: (key: string) => void;
  clearResults: () => void;
}

export interface AsyncProviderProps {
  children: ReactNode;
  maxConcurrent?: number;
}
