import { triggerHaptic, isHapticAvailable, HapticPattern } from "./haptic-feedback";

describe("haptic-feedback", () => {
  const mockVibrate = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    Object.defineProperty(window.navigator, "vibrate", {
      value: mockVibrate,
      writable: true,
      configurable: true,
    });
  });

  describe("triggerHaptic", () => {
    it("should call navigator.vibrate with light pattern", () => {
      triggerHaptic("light");
      expect(mockVibrate).toHaveBeenCalledWith(10);
    });

    it("should call navigator.vibrate with medium pattern", () => {
      triggerHaptic("medium");
      expect(mockVibrate).toHaveBeenCalledWith(20);
    });

    it("should call navigator.vibrate with heavy pattern", () => {
      triggerHaptic("heavy");
      expect(mockVibrate).toHaveBeenCalledWith(30);
    });

    it("should call navigator.vibrate with success pattern", () => {
      triggerHaptic("success");
      expect(mockVibrate).toHaveBeenCalledWith([30, 50, 30]);
    });

    it("should call navigator.vibrate with error pattern", () => {
      triggerHaptic("error");
      expect(mockVibrate).toHaveBeenCalledWith([50, 30, 50]);
    });

    it("should call navigator.vibrate with warning pattern", () => {
      triggerHaptic("warning");
      expect(mockVibrate).toHaveBeenCalledWith([20, 30, 20]);
    });

    it("should use medium as default pattern", () => {
      triggerHaptic();
      expect(mockVibrate).toHaveBeenCalledWith(20);
    });

    it("should not throw when vibrate is not available", () => {
      Object.defineProperty(window.navigator, "vibrate", {
        value: undefined,
        writable: true,
        configurable: true,
      });

      expect(() => triggerHaptic("light")).not.toThrow();
    });

    it("should handle vibrate errors gracefully", () => {
      mockVibrate.mockImplementation(() => {
        throw new Error("Vibration API blocked");
      });

      expect(() => triggerHaptic("light")).not.toThrow();
    });
  });

  describe("isHapticAvailable", () => {
    it("should return true when vibrate is available", () => {
      expect(isHapticAvailable()).toBe(true);
    });

    it("should return false when vibrate is not available", () => {
      Object.defineProperty(window.navigator, "vibrate", {
        value: undefined,
        writable: true,
        configurable: true,
      });

      expect(isHapticAvailable()).toBe(false);
    });
  });
});
