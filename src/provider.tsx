"use client";
import React, { useReducer, useCallback, useMemo } from "react";
import { AsyncContext } from "./context";
import { asyncReducer } from "./reducer";
import type { AsyncProviderProps, AsyncFunction, AsyncResult } from "./types";

const DEFAULT_MAX_CONCURRENT = 5;

export function AsyncProvider({
  children,
  maxConcurrent = DEFAULT_MAX_CONCURRENT,
}: AsyncProviderProps) {
  const [state, dispatch] = useReducer(asyncReducer, {
    functions: {},
    results: {},
  });

  const semaphore = useMemo(() => {
    let running = 0;
    const queue: (() => void)[] = [];

    const next = () => {
      if (running < maxConcurrent && queue.length > 0) {
        running++;
        const task = queue.shift();
        task?.();
      }
    };

    return {
      acquire: () =>
        new Promise<void>((resolve) => {
          const task = () => {
            resolve();
          };
          queue.push(task);
          next();
        }),
      release: () => {
        running--;
        next();
      },
    };
  }, [maxConcurrent]);

  const assignFunction = useCallback(
    <T,>(key: string, asyncFunc: AsyncFunction<T>) => {
      dispatch({ type: "ASSIGN_FUNCTION", key, func: asyncFunc });
    },
    []
  );

  const triggerFunction = useCallback(
    async <T,>(key: string): Promise<void> => {
      const func = state.functions[key] as AsyncFunction<T> | undefined;
      if (!func) {
        throw new Error(`Function with key "${key}" not found`);
      }

      dispatch({ type: "SET_LOADING", key });

      try {
        await semaphore.acquire();
        const result = await func();
        dispatch({ type: "SET_RESULT", key, data: result });
      } catch (error) {
        dispatch({ type: "SET_ERROR", key, error: error as Error });
      } finally {
        semaphore.release();
      }
    },
    [state.functions, semaphore]
  );

  const getResult = useCallback(
    <T,>(key: string): AsyncResult<T> => {
      return (
        state.results[key] || {
          data: null,
          error: null,
          isLoading: false,
        }
      );
    },
    [state.results]
  );

  const removeFunction = useCallback((key: string) => {
    dispatch({ type: "REMOVE_FUNCTION", key });
  }, []);

  const clearResults = useCallback(() => {
    dispatch({ type: "CLEAR_RESULTS" });
  }, []);

  const value = useMemo(
    () => ({
      assignFunction,
      triggerFunction,
      getResult,
      removeFunction,
      clearResults,
    }),
    [assignFunction, triggerFunction, getResult, removeFunction, clearResults]
  );

  return (
    <AsyncContext.Provider value={value}>{children}</AsyncContext.Provider>
  );
}
