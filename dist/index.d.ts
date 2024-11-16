import * as react from 'react';
import { ReactNode } from 'react';
import * as react_jsx_runtime from 'react/jsx-runtime';

type AsyncFunction<T> = () => Promise<T>;
interface AsyncResult<T> {
    data: T | null;
    error: Error | null;
    isLoading: boolean;
}
interface AsyncContextState {
    functions: Record<string, AsyncFunction<any>>;
    results: Record<string, AsyncResult<any>>;
}
interface AsyncContextValue {
    assignFunction: <T>(key: string, asyncFunc: AsyncFunction<T>) => void;
    triggerFunction: <T>(key: string) => Promise<void>;
    getResult: <T>(key: string) => AsyncResult<T>;
    removeFunction: (key: string) => void;
    clearResults: () => void;
}
interface AsyncProviderProps {
    children: ReactNode;
    maxConcurrent?: number;
}

declare const AsyncContext: react.Context<AsyncContextValue | undefined>;

declare function AsyncProvider({ children, maxConcurrent, }: AsyncProviderProps): react_jsx_runtime.JSX.Element;

declare function useAsync(): {
    assign: <T>(key: string, func: AsyncFunction<T>) => void;
    trigger: <T>(key: string) => Promise<void>;
    get: <T>(key: string) => AsyncResult<T>;
    remove: (key: string) => void;
    clear: () => void;
};
declare function useAsyncOperation<T>(key: string, asyncFunc?: AsyncFunction<T>): {
    data: T | null;
    error: Error | null;
    isLoading: boolean;
    execute: () => Promise<void>;
    cleanup: () => void;
};

export { AsyncContext, AsyncContextState, AsyncContextValue, AsyncFunction, AsyncProvider, AsyncProviderProps, AsyncResult, useAsync, useAsyncOperation };
