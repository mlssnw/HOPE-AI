const TRUSTED_CONTEXT = Symbol("hope.phrase-context");
const yes = (evidence, ...keys) => keys.every(key => evidence[key] === true);

const RECORDS = Object.freeze({
  "P7-PHRASE-006": { text: "Isso explica muita coisa. Infelizmente.", category: "DIAGNOSTIC_DRY_ASIDE", cooldown: 12, maxUses: 1, validate: e => yes(e, "verifiedCauseExplainsMultiple", "lowRisk") },
  "P7-PHRASE-007": { text: "Tem um problema aqui. Na verdade, dois. Vamos pelo menos irritante primeiro.", category: "DIAGNOSTIC_TRIAGE_DRY_HUMOR", cooldown: 12, maxUses: 1, validate: e => e.problemCount === 2 && yes(e, "priorityJustified", "lowRisk") },
  "P7-PHRASE-008": { text: "Funciona. Eu também estou surpresa.", category: "VERIFIED_SUCCESS_DRY_HUMOR", cooldown: 15, maxUses: 1, validate: e => yes(e, "resultVerified", "surprisingFragility", "lowRisk") },
  "P7-PHRASE-009": { text: "Isso não é elegante, mas funciona. Por enquanto.", category: "WORKAROUND_LIMITATION", cooldown: 10, maxUses: 2, validate: e => yes(e, "workaroundVerified", "limitationExplained", "exitCriterion", "lowRisk") },
  "P7-PHRASE-010": { text: "Tenho uma solução melhor.", category: "RECOMMENDATION_BETTER_ALTERNATIVE", cooldown: 8, maxUses: 2, validate: e => yes(e, "criteriaCompared", "alternativeIdentified", "lowRisk") },
  "P7-PHRASE-011": { text: "Não recomendo. E tenho motivos.", category: "RECOMMENDATION_DISAGREEMENT", cooldown: 8, maxUses: 2, validate: e => yes(e, "concreteReasons", "lowRisk") },
  "P7-PHRASE-012": { text: "Boa ideia em teoria. A realidade apresentou objeções.", category: "FEASIBILITY_DRY_CRITIQUE", cooldown: 12, maxUses: 1, validate: e => yes(e, "constraintsEvidenced", "alternativeActionable", "lowRisk") },
  "P7-PHRASE-013": { text: "Já achei o problema.", category: "DIAGNOSTIC_FOUND", cooldown: 10, maxUses: 2, validate: e => yes(e, "rootCauseVerified", "lowRisk") },
  "P7-PHRASE-014": { text: "Não é grave. Só está fazendo um esforço impressionante para parecer.", category: "LOW_SEVERITY_REASSURANCE_DRY_HUMOR", cooldown: 15, maxUses: 1, validate: e => yes(e, "severityVerifiedLow", "nextAction", "lowRisk") },
  "P7-PHRASE-015": { text: "Resolvido. Podemos voltar a fingir que isso nunca aconteceu.", category: "VERIFIED_RESOLUTION_DRY_HUMOR", cooldown: 15, maxUses: 1, validate: e => yes(e, "resolutionVerified", "noUnresolvedWarning", "lowRisk") },
  "P7-PHRASE-016": { text: "Tá. Uma coisa por vez.", category: "SUPPORTIVE_PACING", cooldown: 10, maxUses: 1, validate: e => yes(e, "ownerExplicitlyOverwhelmed", "concretePriority", "lowRisk") },
  "P7-PHRASE-017": { text: "Me conta o que aconteceu. Eu organizo daqui.", category: "SUPPORTIVE_CONTEXT_INVITATION", cooldown: 10, maxUses: 1, validate: e => yes(e, "insufficientContext", "nonUrgent", "lowRisk") },
  "P7-PHRASE-018": { text: "Certo. Não precisamos resolver tudo de uma vez.", category: "SUPPORTIVE_SCOPE_REDUCTION", cooldown: 10, maxUses: 1, validate: e => yes(e, "multipleProblems", "immediateScopeDefined", "lowRisk") },
});

export const APPROVED_PHRASE_IDS = Object.freeze(Object.keys(RECORDS));

export function createPhraseContext(candidateId, evidence = {}, options = {}) {
  const record = RECORDS[candidateId];
  if (!record || !record.validate(evidence)) return null;
  return Object.freeze({
    [TRUSTED_CONTEXT]: true,
    candidateId,
    eligibleTurn: Number.isInteger(options.eligibleTurn) && options.eligibleTurn > 0
      ? options.eligibleTurn : 1,
    substantiveReady: options.substantiveReady !== false,
    modeEntry: options.modeEntry === true,
    safetyCritical: options.safetyCritical === true,
    seriousError: options.seriousError === true,
    interruption: options.interruption,
    privacy: options.privacy,
    audience: options.audience,
    style: options.style,
  });
}

export class PhraseLibrary {
  constructor() { this.usage = new Map(); }

  select(context) {
    if (!context?.[TRUSTED_CONTEXT] || !context.substantiveReady) return null;
    const record = RECORDS[context.candidateId];
    if (!record || context.modeEntry || context.safetyCritical || context.seriousError) return null;
    if (context.interruption === "DO_NOT_DISTURB" || context.privacy === "PRIVATE"
      || context.audience === "PUBLIC" || context.style === "FOCUS") return null;
    const usage = this.usage.get(context.candidateId) ?? { count: 0, lastEligibleTurn: -Infinity };
    if (usage.count >= record.maxUses
      || context.eligibleTurn - usage.lastEligibleTurn < record.cooldown) return null;
    this.usage.set(context.candidateId, {
      count: usage.count + 1,
      lastEligibleTurn: context.eligibleTurn,
    });
    return Object.freeze({
      id: context.candidateId,
      text: record.text,
      locale: "pt-BR",
      category: record.category,
    });
  }
}
