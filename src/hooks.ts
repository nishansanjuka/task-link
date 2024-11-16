import { useContext, useCallback, useEffect, useRef } from "react";
import { AsyncContext } from "./context";
import type { AsyncFunction, AsyncResult } from "./types";

// Export both hooks from the same file
export function useAsync() {
  const context = useContext(AsyncContext);
  if (!context) {
    throw new Error("useAsync must be used within an AsyncProvider");
  }

  const {
    assignFunction,
    triggerFunction,
    getResult,
    removeFunction,
    clearResults,
  } = context;

  // Enhanced assign function with type safety
  const assign = useCallback(
    <T>(key: string, func: AsyncFunction<T>) => {
      assignFunction(key, func);
    },
    [assignFunction]
  );

  // Enhanced trigger function with type safety
  const trigger = useCallback(
    <T>(key: string) => {
      return triggerFunction<T>(key);
    },
    [triggerFunction]
  );

  // Enhanced get result function with type safety
  const get = useCallback(
    <T>(key: string): AsyncResult<T> => {
      return getResult<T>(key);
    },
    [getResult]
  );

  // Enhanced remove function
  const remove = useCallback(
    (key: string) => {
      removeFunction(key);
    },
    [removeFunction]
  );

  // Clear all results
  const clear = useCallback(() => {
    clearResults();
  }, [clearResults]);

  return {
    assign,
    trigger,
    get,
    remove,
    clear,
  };
}

export function useAsyncOperation<T>(
  key: string,
  asyncFunc?: AsyncFunction<T>
) {
  const context = useContext(AsyncContext);
  if (!context) {
    throw new Error("useAsync must be used within an AsyncProvider");
  }

  const { assignFunction, triggerFunction, getResult, removeFunction } =
    context;

  const hasAssignedRef = useRef(false);

  const memoizedAsyncFunc = useCallback(
    asyncFunc || (() => Promise.resolve(null)),
    []
  );

  useEffect(() => {
    if (asyncFunc && !hasAssignedRef.current) {
      assignFunction(key, memoizedAsyncFunc);
      hasAssignedRef.current = true;
    }

    return () => {
      if (hasAssignedRef.current) {
        removeFunction(key);
        hasAssignedRef.current = false;
      }
    };
  }, [key, memoizedAsyncFunc, assignFunction, removeFunction]);

  const result = getResult<T>(key);

  const execute = useCallback(() => {
    return triggerFunction<T>(key);
  }, [triggerFunction, key]);

  const cleanup = useCallback(() => {
    removeFunction(key);
    hasAssignedRef.current = false;
  }, [removeFunction, key]);

  return {
    execute,
    cleanup,
    ...result,
  };
}
