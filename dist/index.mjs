// src/context.ts
import { createContext } from "react";
var AsyncContext = createContext(
  void 0
);
AsyncContext.displayName = "AsyncContext";

// src/provider.tsx
import { useReducer, useCallback, useMemo } from "react";

// src/reducer.ts
function asyncReducer(state, action) {
  switch (action.type) {
    case "ASSIGN_FUNCTION":
      return {
        ...state,
        functions: {
          ...state.functions,
          [action.key]: action.func
        }
      };
    case "REMOVE_FUNCTION":
      const { [action.key]: _, ...remainingFunctions } = state.functions;
      const { [action.key]: __, ...remainingResults } = state.results;
      return {
        functions: remainingFunctions,
        results: remainingResults
      };
    case "SET_LOADING":
      return {
        ...state,
        results: {
          ...state.results,
          [action.key]: {
            ...state.results[action.key],
            isLoading: true,
            error: null
          }
        }
      };
    case "SET_RESULT":
      return {
        ...state,
        results: {
          ...state.results,
          [action.key]: {
            data: action.data,
            error: null,
            isLoading: false
          }
        }
      };
    case "SET_ERROR":
      return {
        ...state,
        results: {
          ...state.results,
          [action.key]: {
            data: null,
            error: action.error,
            isLoading: false
          }
        }
      };
    case "CLEAR_RESULTS":
      return {
        ...state,
        results: {}
      };
    default:
      return state;
  }
}

// src/provider.tsx
import { jsx } from "react/jsx-runtime";
var DEFAULT_MAX_CONCURRENT = 5;
function AsyncProvider({
  children,
  maxConcurrent = DEFAULT_MAX_CONCURRENT
}) {
  const [state, dispatch] = useReducer(asyncReducer, {
    functions: {},
    results: {}
  });
  const semaphore = useMemo(() => {
    let running = 0;
    const queue = [];
    const next = () => {
      if (running < maxConcurrent && queue.length > 0) {
        running++;
        const task = queue.shift();
        task?.();
      }
    };
    return {
      acquire: () => new Promise((resolve) => {
        const task = () => {
          resolve();
        };
        queue.push(task);
        next();
      }),
      release: () => {
        running--;
        next();
      }
    };
  }, [maxConcurrent]);
  const assignFunction = useCallback(
    (key, asyncFunc) => {
      dispatch({ type: "ASSIGN_FUNCTION", key, func: asyncFunc });
    },
    []
  );
  const triggerFunction = useCallback(
    async (key) => {
      const func = state.functions[key];
      if (!func) {
        throw new Error(`Function with key "${key}" not found`);
      }
      dispatch({ type: "SET_LOADING", key });
      try {
        await semaphore.acquire();
        const result = await func();
        dispatch({ type: "SET_RESULT", key, data: result });
      } catch (error) {
        dispatch({ type: "SET_ERROR", key, error });
      } finally {
        semaphore.release();
      }
    },
    [state.functions, semaphore]
  );
  const getResult = useCallback(
    (key) => {
      return state.results[key] || {
        data: null,
        error: null,
        isLoading: false
      };
    },
    [state.results]
  );
  const removeFunction = useCallback((key) => {
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
      clearResults
    }),
    [assignFunction, triggerFunction, getResult, removeFunction, clearResults]
  );
  return /* @__PURE__ */ jsx(AsyncContext.Provider, { value, children });
}

// src/hooks.ts
import { useContext, useCallback as useCallback2, useEffect, useRef } from "react";
function useAsync() {
  const context = useContext(AsyncContext);
  if (!context) {
    throw new Error("useAsync must be used within an AsyncProvider");
  }
  const {
    assignFunction,
    triggerFunction,
    getResult,
    removeFunction,
    clearResults
  } = context;
  const assign = useCallback2(
    (key, func) => {
      assignFunction(key, func);
    },
    [assignFunction]
  );
  const trigger = useCallback2(
    (key) => {
      return triggerFunction(key);
    },
    [triggerFunction]
  );
  const get = useCallback2(
    (key) => {
      return getResult(key);
    },
    [getResult]
  );
  const remove = useCallback2(
    (key) => {
      removeFunction(key);
    },
    [removeFunction]
  );
  const clear = useCallback2(() => {
    clearResults();
  }, [clearResults]);
  return {
    assign,
    trigger,
    get,
    remove,
    clear
  };
}
function useAsyncOperation(key, asyncFunc) {
  const context = useContext(AsyncContext);
  if (!context) {
    throw new Error("useAsync must be used within an AsyncProvider");
  }
  const { assignFunction, triggerFunction, getResult, removeFunction } = context;
  const hasAssignedRef = useRef(false);
  const memoizedAsyncFunc = useCallback2(
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
  const result = getResult(key);
  const execute = useCallback2(() => {
    return triggerFunction(key);
  }, [triggerFunction, key]);
  const cleanup = useCallback2(() => {
    removeFunction(key);
    hasAssignedRef.current = false;
  }, [removeFunction, key]);
  return {
    execute,
    cleanup,
    ...result
  };
}
export {
  AsyncContext,
  AsyncProvider,
  useAsync,
  useAsyncOperation
};
