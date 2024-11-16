"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var src_exports = {};
__export(src_exports, {
  AsyncContext: () => AsyncContext,
  AsyncProvider: () => AsyncProvider,
  useAsync: () => useAsync,
  useAsyncOperation: () => useAsyncOperation
});
module.exports = __toCommonJS(src_exports);

// src/context.ts
var import_react = require("react");
var AsyncContext = (0, import_react.createContext)(
  void 0
);
AsyncContext.displayName = "AsyncContext";

// src/provider.tsx
var import_react2 = require("react");

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
var import_jsx_runtime = require("react/jsx-runtime");
var DEFAULT_MAX_CONCURRENT = 5;
function AsyncProvider({
  children,
  maxConcurrent = DEFAULT_MAX_CONCURRENT
}) {
  const [state, dispatch] = (0, import_react2.useReducer)(asyncReducer, {
    functions: {},
    results: {}
  });
  const semaphore = (0, import_react2.useMemo)(() => {
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
  const assignFunction = (0, import_react2.useCallback)(
    (key, asyncFunc) => {
      dispatch({ type: "ASSIGN_FUNCTION", key, func: asyncFunc });
    },
    []
  );
  const triggerFunction = (0, import_react2.useCallback)(
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
  const getResult = (0, import_react2.useCallback)(
    (key) => {
      return state.results[key] || {
        data: null,
        error: null,
        isLoading: false
      };
    },
    [state.results]
  );
  const removeFunction = (0, import_react2.useCallback)((key) => {
    dispatch({ type: "REMOVE_FUNCTION", key });
  }, []);
  const clearResults = (0, import_react2.useCallback)(() => {
    dispatch({ type: "CLEAR_RESULTS" });
  }, []);
  const value = (0, import_react2.useMemo)(
    () => ({
      assignFunction,
      triggerFunction,
      getResult,
      removeFunction,
      clearResults
    }),
    [assignFunction, triggerFunction, getResult, removeFunction, clearResults]
  );
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AsyncContext.Provider, { value, children });
}

// src/hooks.ts
var import_react3 = require("react");
function useAsync() {
  const context = (0, import_react3.useContext)(AsyncContext);
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
  const assign = (0, import_react3.useCallback)(
    (key, func) => {
      assignFunction(key, func);
    },
    [assignFunction]
  );
  const trigger = (0, import_react3.useCallback)(
    (key) => {
      return triggerFunction(key);
    },
    [triggerFunction]
  );
  const get = (0, import_react3.useCallback)(
    (key) => {
      return getResult(key);
    },
    [getResult]
  );
  const remove = (0, import_react3.useCallback)(
    (key) => {
      removeFunction(key);
    },
    [removeFunction]
  );
  const clear = (0, import_react3.useCallback)(() => {
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
  const context = (0, import_react3.useContext)(AsyncContext);
  if (!context) {
    throw new Error("useAsync must be used within an AsyncProvider");
  }
  const { assignFunction, triggerFunction, getResult, removeFunction } = context;
  const hasAssignedRef = (0, import_react3.useRef)(false);
  const memoizedAsyncFunc = (0, import_react3.useCallback)(
    asyncFunc || (() => Promise.resolve(null)),
    []
  );
  (0, import_react3.useEffect)(() => {
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
  const execute = (0, import_react3.useCallback)(() => {
    return triggerFunction(key);
  }, [triggerFunction, key]);
  const cleanup = (0, import_react3.useCallback)(() => {
    removeFunction(key);
    hasAssignedRef.current = false;
  }, [removeFunction, key]);
  return {
    execute,
    cleanup,
    ...result
  };
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  AsyncContext,
  AsyncProvider,
  useAsync,
  useAsyncOperation
});
