import { AsyncContextState, AsyncResult } from "./types";

export type AsyncAction =
  | { type: "ASSIGN_FUNCTION"; key: string; func: () => Promise<any> }
  | { type: "REMOVE_FUNCTION"; key: string }
  | { type: "SET_LOADING"; key: string }
  | { type: "SET_RESULT"; key: string; data: any }
  | { type: "SET_ERROR"; key: string; error: Error }
  | { type: "CLEAR_RESULTS" };

export function asyncReducer(
  state: AsyncContextState,
  action: AsyncAction
): AsyncContextState {
  switch (action.type) {
    case "ASSIGN_FUNCTION":
      return {
        ...state,
        functions: {
          ...state.functions,
          [action.key]: action.func,
        },
      };
    case "REMOVE_FUNCTION":
      const { [action.key]: _, ...remainingFunctions } = state.functions;
      const { [action.key]: __, ...remainingResults } = state.results;
      return {
        functions: remainingFunctions,
        results: remainingResults,
      };
    case "SET_LOADING":
      return {
        ...state,
        results: {
          ...state.results,
          [action.key]: {
            ...state.results[action.key],
            isLoading: true,
            error: null,
          },
        },
      };
    case "SET_RESULT":
      return {
        ...state,
        results: {
          ...state.results,
          [action.key]: {
            data: action.data,
            error: null,
            isLoading: false,
          },
        },
      };
    case "SET_ERROR":
      return {
        ...state,
        results: {
          ...state.results,
          [action.key]: {
            data: null,
            error: action.error,
            isLoading: false,
          },
        },
      };
    case "CLEAR_RESULTS":
      return {
        ...state,
        results: {},
      };
    default:
      return state;
  }
}
