import { describe, it, expect } from "vitest";
import { CriteriaEngine, type ScoringContext } from "../criteriaEngine";

describe("CriteriaEngine", () => {
  let engine: CriteriaEngine;
  let emptyContext: ScoringContext;

  beforeEach(() => {
    engine = new CriteriaEngine();
    emptyContext = { votacoes: [], despesas: [], mandatos: 1, tempo_servico: 2 };
  });

  describe("classifyPerformance", () => {
    it("returns 'excellent' for score >= 80", () => {
      const result = engine.classifyPerformance(85);
      expect(result.level).toBe("excellent");
      expect(result.label).toBe("Excelente");
    });

    it("returns 'good' for score between 60 and 79", () => {
      const result = engine.classifyPerformance(65);
      expect(result.level).toBe("good");
      expect(result.label).toBe("Bom");
    });

    it("returns 'average' for score between 40 and 59", () => {
      const result = engine.classifyPerformance(50);
      expect(result.level).toBe("average");
      expect(result.label).toBe("Médio");
    });

    it("returns 'poor' for score < 40", () => {
      const result = engine.classifyPerformance(30);
      expect(result.level).toBe("poor");
      expect(result.label).toBe("Insuficiente");
    });

    it("handles boundary values", () => {
      expect(engine.classifyPerformance(80).level).toBe("excellent");
      expect(engine.classifyPerformance(79).level).toBe("good");
      expect(engine.classifyPerformance(60).level).toBe("good");
      expect(engine.classifyPerformance(59).level).toBe("average");
      expect(engine.classifyPerformance(40).level).toBe("average");
      expect(engine.classifyPerformance(39).level).toBe("poor");
    });
  });

  describe("calculateScore", () => {
    it("returns neutral scores for empty context", () => {
      const scores = engine.calculateScore(emptyContext);
      expect(scores.lifeProtection).toBe(50);
      expect(scores.familyValues).toBe(50);
      expect(scores.moralIntegrity).toBe(80);
      expect(scores.socialResponsibility).toBe(50);
      expect(scores.religiousFreedom).toBe(60);
    });

    it("overall is weighted average clamped 0-100", () => {
      const scores = engine.calculateScore(emptyContext);
      expect(scores.overall).toBeGreaterThanOrEqual(0);
      expect(scores.overall).toBeLessThanOrEqual(100);
    });
  });

  describe("generateDetailedAnalysis", () => {
    it("returns empty arrays for empty context", () => {
      const scores = engine.calculateScore(emptyContext);
      const analysis = engine.generateDetailedAnalysis(emptyContext, scores);
      expect(analysis.strengths).toBeDefined();
      expect(analysis.weaknesses).toBeDefined();
      expect(analysis.recommendations).toBeDefined();
      expect(analysis.keyVotes).toEqual([]);
    });
  });
});
