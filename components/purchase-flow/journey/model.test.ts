import { describe, expect, it } from "vitest";
import { evaluate, scenariosFor } from "@/lib/purchase-flow/model";
import { makeStory, stagesFor } from "@/lib/purchase-flow/story";
import { journeyAt } from "./model";

describe("purchase journey", () => {
  for (const scenario of scenariosFor("buyer")) {
    const evaluation = evaluate(scenario);
    const story = makeStory(stagesFor(scenario, evaluation));
    it(`${scenario.label}: responds on the first animation frame`, () => {
      const start = journeyAt(scenario, evaluation, story, 0);
      const next = journeyAt(scenario, evaluation, story, 1 / 60);
      expect(start.screen[0]).toBe(0);
      expect(next.screen[0]).toBeGreaterThan(0);
      expect(next.belt).toBeGreaterThan(start.belt);
      expect(journeyAt(scenario, evaluation, story, story.total).screen).toEqual([1, 1, 1, 1]);
    });
    it(`${scenario.label}: uses the evaluated outcome`, () => {
      const end = journeyAt(scenario, evaluation, story, story.total);
      expect(end.frame.gateVerdict).toBe(evaluation.verdict);
      expect(end.frame.bundleTotalPaise).toBe(evaluation.totalPaise);
      if (evaluation.verdict === "blocked") {
        expect(end.bubbles[1]!.text).toBe("Order limit exceeded");
        expect(end.bubbles[2]!.text).toBe("Checkout not started");
        expect(end.handoffs[1]).toBe("blocked");
        expect(end.ticketX).toBe(560);
        expect(end.gateOpen).toBe(0);
        expect(end.receipt).toBe(0);
        expect(end.frame.payState).toBe("idle");
      } else {
        expect(end.bubbles[2]!.text).toBe(scenario.payment === "succeeded" ? "Receipt issued" : "Payment declined");
        expect(end.ticketX).toBe(930);
        expect(end.gateOpen).toBe(1);
        expect(end.receipt).toBe(scenario.payment === "succeeded" ? 1 : 0);
        expect(end.frame.payState).toBe(scenario.payment === "succeeded" ? "succeeded" : "declined");
      }
    });
    it(`${scenario.label}: explains only the current step`, () => {
      const start = journeyAt(scenario, evaluation, story, 0);
      expect(start.bubbles.map((bubble) => bubble.text)).toEqual(["Request received", "Awaiting proposal", "Waiting for approval"]);
      expect(start.handoffs).toEqual(["waiting", "waiting"]);
      const screenIndex = story.stages.findIndex((stage) => stage.id === "screen");
      const duringCheck = journeyAt(scenario, evaluation, story, story.starts[screenIndex]! + .4);
      expect(duringCheck.bubbles[1]!.text).toBe("Checking your limits");
      expect(duringCheck.bubbles[2]!.text).toBe("Waiting for approval");
    });
    it(`${scenario.label}: keeps the camera and moving parts bounded`, () => {
      for (let clock = 0; clock <= story.total; clock += .1) {
        const pose = journeyAt(scenario, evaluation, story, clock);
        expect(pose.ticketX).toBeGreaterThanOrEqual(190);
        expect(pose.ticketX).toBeLessThanOrEqual(930);
        expect(pose.cameraX).toBeGreaterThanOrEqual(0);
        expect(pose.cameraX).toBeLessThanOrEqual(740);
        expect(pose.receipt).toBeGreaterThanOrEqual(0);
        expect(pose.receipt).toBeLessThanOrEqual(1);
      }
    });
  }
});
