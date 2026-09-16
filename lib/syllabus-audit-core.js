function text(value) {
  return typeof value === "string" ? value.trim() : "";
}

function slug(value) {
  return text(value)
    .normalize("NFKC")
    .toLocaleLowerCase()
    .replace(/[’'"“”‘’]/gu, "")
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/gu, "");
}

export function normalizeRequirementKey(requirement = {}) {
  const canonicalId = text(requirement.canonicalId);
  if (canonicalId) return canonicalId;
  const id = text(requirement.id);
  if (id) return id;
  const kind = slug(requirement.kind) || "requirement";
  const label = slug(requirement.label ?? requirement.name ?? requirement.pattern);
  return `${kind}:${label || "unnamed"}`;
}

export function buildRequiredUnion(sources = []) {
  const byId = new Map();

  for (const source of sources) {
    const sourceId = text(source?.id) || "unknown-source";
    const requirements = Array.isArray(source?.requirements) ? source.requirements : [];
    for (const requirement of requirements) {
      if (!requirement || typeof requirement !== "object") continue;
      const id = normalizeRequirementKey(requirement);
      const sourceRequirementId = text(requirement.id) || id;
      const current = byId.get(id) ?? {
        ...requirement,
        id,
        evidenceSources: [],
        sourceRequirementIds: [],
        evidence: [],
      };

      current.evidenceSources = [...new Set([...current.evidenceSources, sourceId])];
      current.sourceRequirementIds = [...new Set([...current.sourceRequirementIds, sourceRequirementId])];
      current.evidence.push({
        sourceId,
        sourceRequirementId,
        ...(source.volume ? { volume: source.volume } : {}),
        ...(requirement.lesson != null ? { lesson: requirement.lesson } : {}),
        ...(requirement.sourceLevel ? { sourceLevel: requirement.sourceLevel } : {}),
      });
      byId.set(id, current);
    }
  }

  return [...byId.values()];
}

export function auditSyllabusPlacement({ requirements = [], lessons = [], aliases = {}, rejected = {} } = {}) {
  const placements = new Map();
  for (const lesson of lessons) {
    if (!lesson || typeof lesson !== "object") continue;
    const requirementIds = Array.isArray(lesson.requirementIds) ? lesson.requirementIds : [];
    for (const requirementId of requirementIds) {
      const id = text(requirementId);
      if (!id) continue;
      const status = lesson.placementStatus === "rich" ? "placed-rich" : "placed-provisional";
      const existing = placements.get(id);
      if (!existing || status === "placed-rich") {
        placements.set(id, { status, lessonId: text(lesson.id) || null });
      }
    }
  }

  const requirementIds = new Set(requirements.map((item) => text(item?.id)).filter(Boolean));
  const resultItems = [];
  const unplaced = [];

  for (const requirement of requirements) {
    if (!requirement || typeof requirement !== "object") continue;
    const id = text(requirement.id) || normalizeRequirementKey(requirement);
    const placement = placements.get(id);
    if (placement) {
      resultItems.push({ ...requirement, id, ...placement });
      continue;
    }

    const aliasTarget = text(aliases?.[id]);
    if (aliasTarget && aliasTarget !== id && requirementIds.has(aliasTarget) && placements.has(aliasTarget)) {
      resultItems.push({ ...requirement, id, status: "duplicate-alias", canonicalId: aliasTarget });
      continue;
    }

    const rejectionReason = text(rejected?.[id]);
    if (rejectionReason) {
      resultItems.push({ ...requirement, id, status: "rejected-with-reason", reason: rejectionReason });
      continue;
    }

    const missing = { ...requirement, id, status: "required-unplaced" };
    resultItems.push(missing);
    unplaced.push(missing);
  }

  const summary = {
    required: resultItems.length,
    placedRich: resultItems.filter((item) => item.status === "placed-rich").length,
    placedProvisional: resultItems.filter((item) => item.status === "placed-provisional").length,
    duplicateAlias: resultItems.filter((item) => item.status === "duplicate-alias").length,
    rejectedWithReason: resultItems.filter((item) => item.status === "rejected-with-reason").length,
    requiredUnplaced: unplaced.length,
  };

  return {
    ok: unplaced.length === 0,
    summary,
    items: resultItems,
    unplaced,
  };
}
