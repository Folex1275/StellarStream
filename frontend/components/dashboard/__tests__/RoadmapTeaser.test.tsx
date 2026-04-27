import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import RoadmapTeaser from "../RoadmapTeaser";

describe("RoadmapTeaser", () => {
  it("renders without crashing", () => {
    render(<RoadmapTeaser />);
    expect(screen.getByText("V4 Roadmap")).toBeInTheDocument();
  });

  it("displays overall progress percentage", () => {
    render(<RoadmapTeaser />);
    expect(screen.getByText("62%")).toBeInTheDocument();
  });

  it("displays all roadmap features", () => {
    render(<RoadmapTeaser />);
    expect(screen.getByText("Automated Tax Withholding")).toBeInTheDocument();
    expect(screen.getByText("Direct Bank Bridges")).toBeInTheDocument();
    expect(screen.getByText("Multi-Chain Support")).toBeInTheDocument();
    expect(screen.getByText("Advanced Analytics Dashboard")).toBeInTheDocument();
    expect(screen.getByText("Batch Payment Optimization")).toBeInTheDocument();
  });

  it("displays feature descriptions", () => {
    render(<RoadmapTeaser />);
    expect(screen.getByText(/Automatic tax calculation/)).toBeInTheDocument();
    expect(screen.getByText(/Connect directly to traditional bank accounts/)).toBeInTheDocument();
  });

  it("displays vote buttons for each feature", () => {
    render(<RoadmapTeaser />);
    const voteButtons = screen.getAllByText("Vote");
    expect(voteButtons.length).toBeGreaterThan(0);
  });

  it("displays vote counts for each feature", () => {
    render(<RoadmapTeaser />);
    expect(screen.getByText(/234 votes/)).toBeInTheDocument();
    expect(screen.getByText(/189 votes/)).toBeInTheDocument();
    expect(screen.getByText(/156 votes/)).toBeInTheDocument();
  });

  it("shows feature status badges", () => {
    render(<RoadmapTeaser />);
    expect(screen.getAllByText("completed").length).toBeGreaterThan(0);
    expect(screen.getAllByText("in-progress").length).toBeGreaterThan(0);
    expect(screen.getAllByText("planned").length).toBeGreaterThan(0);
  });

  it("displays footer message", () => {
    render(<RoadmapTeaser />);
    expect(screen.getByText(/Your feedback helps us prioritize/)).toBeInTheDocument();
  });

  it("has accessible button labels", () => {
    render(<RoadmapTeaser />);
    const voteButtons = screen.getAllByRole("button");
    voteButtons.forEach((button: HTMLElement) => {
      expect(button).toHaveAttribute("aria-label");
    });
  });

  it("renders progress bar with correct width", () => {
    const { container } = render(<RoadmapTeaser />);
    const progressBar = container.querySelector('[style*="width: 62%"]');
    expect(progressBar).toBeInTheDocument();
  });
});
