# React Async Context

![Version](https://img.shields.io/npm/v/task-link)
![License](https://img.shields.io/npm/l/task-link)
![Downloads](https://img.shields.io/npm/dt/task-link)

A powerful and flexible React context library for managing asynchronous operations with TypeScript support. This library provides a clean, centralized way to handle async operations in your React applications with built-in concurrency control, type safety, and optimal performance.

## Features

- 🚀 **TypeScript-first**: Full type safety and IntelliSense support
- 🎯 **Concurrent Operation Control**: Limit parallel operations to prevent resource overload
- 🔄 **Automatic State Management**: Track loading, error, and success states
- 🧹 **Memory Management**: Built-in cleanup utilities to prevent memory leaks
- ⚡ **Performance Optimized**: Minimizes re-renders and optimizes state updates
- 🎣 **Dual Hooks API**: Choose between managed operations or direct control
- 🛡️ **Error Boundary Compatible**: Properly handles and propagates errors
- 🔍 **Operation Tracking**: Monitor and control multiple operations simultaneously
- 🎭 **Flexible State Access**: Direct access to operation states across components
- 🧪 **Enhanced Testing Support**: Improved testability with operation lifecycle controls

## Installation

```bash
npm install task-link
# or
yarn add task-link
# or
pnpm add task-link
```

## Quick Start

### 1. Wrap your application with AsyncProvider

```tsx
import { AsyncProvider } from "task-link";

function App() {
  return (
    <AsyncProvider maxConcurrent={5}>
      <YourApp />
    </AsyncProvider>
  );
}
```

### 2. Choose Your Hook Style

#### Managed Operations (useAsyncOperation)

```tsx
import { useAsyncOperation } from "task-link";

function UserProfile({ userId }: { userId: string }) {
  const { execute, data, error, isLoading } = useAsyncOperation(
    `fetch-user-${userId}`,
    async () => {
      const response = await fetch(`/api/users/${userId}`);
      return response.json();
    }
  );

  useEffect(() => {
    execute();
  }, [userId]);

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;
  if (data) return <div>Welcome, {data.name}!</div>;
  return null;
}
```

#### Direct Control (useAsync)

```tsx
import { useAsync } from "task-link";

function DataManager() {
  const { assign, trigger, get, remove, clear } = useAsync();

  // Assign operations
  useEffect(() => {
    assign("fetch-users", async () => {
      const response = await fetch("/api/users");
      return response.json();
    });

    assign("fetch-posts", async () => {
      const response = await fetch("/api/posts");
      return response.json();
    });

    return () => {
      remove("fetch-users");
      remove("fetch-posts");
    };
  }, [assign, remove]);

  // Get operation states
  const usersResult = get<User[]>("fetch-users");
  const postsResult = get<Post[]>("fetch-posts");

  // Trigger multiple operations
  const handleFetchAll = async () => {
    await Promise.all([
      trigger<User[]>("fetch-users"),
      trigger<Post[]>("fetch-posts"),
    ]);
  };

  return (
    <div>
      <button onClick={handleFetchAll}>Fetch All Data</button>
      <button onClick={clear}>Clear All Results</button>

      {usersResult.isLoading && <div>Loading users...</div>}
      {postsResult.isLoading && <div>Loading posts...</div>}

      {usersResult.data && <UsersList users={usersResult.data} />}
      {postsResult.data && <PostsList posts={postsResult.data} />}
    </div>
  );
}
```

## API Reference

### `AsyncProvider`

```tsx
interface AsyncProviderProps {
  children: ReactNode;
  maxConcurrent?: number; // Default: 5
}
```

### `useAsyncOperation`

```tsx
function useAsyncOperation<T>(
  key: string,
  asyncFunc?: () => Promise<T>
): {
  execute: () => Promise<void>;
  cleanup: () => void;
  data: T | null;
  error: Error | null;
  isLoading: boolean;
};
```

### `useAsync`

```tsx
function useAsync(): {
  assign: <T>(key: string, func: () => Promise<T>) => void;
  trigger: <T>(key: string) => Promise<void>;
  get: <T>(key: string) => AsyncResult<T>;
  remove: (key: string) => void;
  clear: () => void;
};
```

## Advanced Usage

### Combining Both Hooks

```tsx
function HybridComponent() {
  // Managed operation for primary functionality
  const { execute: fetchUser, data: userData } = useAsyncOperation(
    "fetch-user",
    async () => {
      const response = await fetch("/api/user");
      return response.json();
    }
  );

  // Direct control for additional operations
  const { assign, trigger, get } = useAsync();

  useEffect(() => {
    assign("analytics", async () => {
      await fetch("/api/analytics", { method: "POST" });
    });
  }, [assign]);

  const handleUserAction = async () => {
    await fetchUser();
    await trigger("analytics");
  };

  return <button onClick={handleUserAction}>Perform Action</button>;
}
```

### Operation State Management

```tsx
function StateManager() {
  const { assign, get, clear } = useAsync();

  // Get states across components
  const userState = get<User>("user-operation");
  const postState = get<Post>("post-operation");

  // Clear all operation results
  const handleReset = () => {
    clear();
  };

  return (
    <div>
      <OperationStatus state={userState} />
      <OperationStatus state={postState} />
      <button onClick={handleReset}>Reset All</button>
    </div>
  );
}
```

## Best Practices

### 1. Operation Key Management

```tsx
// Use constants for operation keys
const OPERATION_KEYS = {
  FETCH_USER: (id: string) => `fetch-user-${id}`,
  FETCH_POSTS: (userId: string) => `fetch-posts-${userId}`,
} as const;

// Use in components
const { execute } = useAsyncOperation(OPERATION_KEYS.FETCH_USER(userId));
```

### 2. Type Safety

```tsx
interface User {
  id: string;
  name: string;
}

// With useAsyncOperation
const { data } = useAsyncOperation<User>("fetch-user", fetchUser);

// With useAsync
const { get } = useAsync();
const result = get<User>("fetch-user");
```

### 3. Cleanup Pattern

```tsx
function Component() {
  const { assign, remove } = useAsync();

  useEffect(() => {
    const operations = [
      [
        "op1",
        async () => {
          /* ... */
        },
      ],
      [
        "op2",
        async () => {
          /* ... */
        },
      ],
    ] as const;

    operations.forEach(([key, func]) => assign(key, func));

    return () => {
      operations.forEach(([key]) => remove(key));
    };
  }, [assign, remove]);
}
```

For more details, see our [full documentation](docs/README.md).

## License

MIT © Nipuna Nishan
