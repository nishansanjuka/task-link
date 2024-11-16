import { describe, it, expect, vi } from "vitest";
import { renderHook, act } from "@testing-library/react-hooks/dom";
import React from "react";
import { AsyncProvider, useAsync, useAsyncOperation } from "../src";

describe("AsyncProvider", () => {
  it("should handle successful async operations", async () => {
    const mockAsyncFunction = vi.fn().mockResolvedValue("success");
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AsyncProvider>{children}</AsyncProvider>
    );

    const { result, waitForNextUpdate } = renderHook(
      () => useAsyncOperation("test", mockAsyncFunction),
      { wrapper }
    );

    expect(result.current.isLoading).toBe(false);
    expect(result.current.data).toBe(null);
    expect(result.current.error).toBe(null);

    act(() => {
      result.current.execute();
    });

    expect(result.current.isLoading).toBe(true);

    await waitForNextUpdate();

    expect(result.current.isLoading).toBe(false);
    expect(result.current.data).toBe("success");
    expect(result.current.error).toBe(null);
  });

  it("should handle errors in async operations", async () => {
    const error = new Error("Test error");
    const mockAsyncFunction = vi.fn().mockRejectedValue(error);
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AsyncProvider>{children}</AsyncProvider>
    );

    const { result, waitForNextUpdate } = renderHook(
      () => useAsyncOperation("test", mockAsyncFunction),
      { wrapper }
    );

    act(() => {
      result.current.execute();
    });

    await waitForNextUpdate();

    expect(result.current.isLoading).toBe(false);
    expect(result.current.data).toBe(null);
    expect(result.current.error).toBe(error);
  });

  it("should respect maxConcurrent limit", async () => {
    const delay = (ms: number) =>
      new Promise((resolve) => setTimeout(resolve, ms));

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AsyncProvider maxConcurrent={2}>{children}</AsyncProvider>
    );

    // Track when each function starts
    const startTimes: number[] = [];
    const mockAsyncFunction = vi.fn().mockImplementation(async () => {
      startTimes.push(Date.now());
      await delay(100);
      return true;
    });

    const { result } = renderHook(
      () => [
        useAsyncOperation("test1", mockAsyncFunction),
        useAsyncOperation("test2", mockAsyncFunction),
        useAsyncOperation("test3", mockAsyncFunction),
      ],
      { wrapper }
    );

    // Execute all operations
    await act(async () => {
      // Start all operations
      const promises = [
        result.current[0].execute(),
        result.current[1].execute(),
        result.current[2].execute(),
      ];

      // Wait a small amount of time for the first two operations to start
      await delay(50);

      // At this point, only 2 operations should have started
      expect(startTimes.length).toBe(2);

      // Wait for all operations to complete
      await Promise.all(promises);
    });

    // After all operations complete, all should have been called
    expect(mockAsyncFunction).toHaveBeenCalledTimes(3);

    // Verify the third operation started after one of the first two completed
    expect(startTimes[2] - startTimes[0]).toBeGreaterThanOrEqual(100);
    // or
    expect(startTimes[2] - startTimes[1]).toBeGreaterThanOrEqual(100);
  });

  it("should handle successful async  using hook itself", async () => {
    let resolvedText = "un-resolved";
    const mockFunction = async () => {
      const res = await new Promise((resolve: (value: string) => void) => {
        setTimeout(() => {
          resolve("Hello, world!");
        }, 50);
      });
      resolvedText = res;
    };
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AsyncProvider>{children}</AsyncProvider>
    );

    const { result } = renderHook(() => useAsync(), {
      wrapper,
    });

    result.current.assign("f1", mockFunction);
    expect(resolvedText).toBe("un-resolved");
    await result.current.trigger("f1");
    expect(resolvedText).toBe("Hello, world!");
  });
});
