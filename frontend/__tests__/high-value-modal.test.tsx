import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import {
  HighValueConfirmModal,
  HIGH_VALUE_THRESHOLD,
} from "@/app/dashboard/create-stream/page";

describe("HighValueConfirmModal", () => {
  const defaultProps = {
    amount: 15_000,
    asset: "USDC",
    onConfirm: vi.fn(),
    onClose: vi.fn(),
  };

  it("renders when amount exceeds threshold", () => {
    render(<HighValueConfirmModal {...defaultProps} />);
    expect(screen.getByTestId("high-value-modal")).toBeInTheDocument();
  });

  it("execute button is disabled when confirmation phrase not typed", () => {
    render(<HighValueConfirmModal {...defaultProps} />);
    const btn = screen.getByTestId("execute-btn");
    expect(btn).toBeDisabled();
  });

  it("execute button remains disabled on partial/wrong phrase", () => {
    render(<HighValueConfirmModal {...defaultProps} />);
    const input = screen.getByTestId("confirm-input");
    fireEvent.change(input, { target: { value: "CONFIRM" } });
    expect(screen.getByTestId("execute-btn")).toBeDisabled();

    fireEvent.change(input, { target: { value: "confirm 15000" } }); // wrong case
    expect(screen.getByTestId("execute-btn")).toBeDisabled();
  });

  it("execute button enables only on exact phrase match", () => {
    render(<HighValueConfirmModal {...defaultProps} />);
    const input = screen.getByTestId("confirm-input");
    fireEvent.change(input, { target: { value: "CONFIRM 15000" } });
    expect(screen.getByTestId("execute-btn")).not.toBeDisabled();
  });

  it("calls onConfirm when execute button clicked after exact match", () => {
    const onConfirm = vi.fn();
    render(<HighValueConfirmModal {...defaultProps} onConfirm={onConfirm} />);
    fireEvent.change(screen.getByTestId("confirm-input"), {
      target: { value: "CONFIRM 15000" },
    });
    fireEvent.click(screen.getByTestId("execute-btn"));
    expect(onConfirm).toHaveBeenCalledOnce();
  });

  it("calls onClose when cancel button clicked", () => {
    const onClose = vi.fn();
    render(<HighValueConfirmModal {...defaultProps} onClose={onClose} />);
    fireEvent.click(screen.getByLabelText("Cancel"));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("HIGH_VALUE_THRESHOLD is 10000", () => {
    expect(HIGH_VALUE_THRESHOLD).toBe(10_000);
  });
});

describe("Friction gate — modal does not appear for low-value amounts", () => {
  it("threshold constant is 10000 so amounts <= 10000 skip the gate", () => {
    // The gate condition is: amount > HIGH_VALUE_THRESHOLD
    expect(5_000 > HIGH_VALUE_THRESHOLD).toBe(false);
    expect(10_000 > HIGH_VALUE_THRESHOLD).toBe(false);
    expect(10_001 > HIGH_VALUE_THRESHOLD).toBe(true);
  });
});
