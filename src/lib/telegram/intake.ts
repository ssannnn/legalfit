import {
  validateCriticalData,
  type DocumentState,
  type ReadinessInput
} from "../routing/readiness";

export type IntakeState =
  | "intake_started"
  | "awaiting_processing_consent"
  | "collecting_case_description"
  | "collecting_missing_info"
  | "collecting_contact"
  | "collecting_signals"
  | "collecting_documentation"
  | "awaiting_confirmation"
  | "awaiting_handoff_consent"
  | "awaiting_minimal_capture_consent"
  | "confirmed_profile"
  | "closed_no_handoff"
  | "out_of_scope";

export type IntakeSessionSnapshot = {
  state: IntakeState;
  currentStep: string;
  extractedFields: Partial<ReadinessInput> & Record<string, unknown>;
};

export type IntakeResult = {
  replies: string[];
  sessionPatch: IntakeSessionSnapshot;
  missingCriticalFields: string[];
  leadCasePatch?: {
    lifecycleState?: string;
    processingConsent?: boolean;
    handoffConsent?: boolean;
    contactConsent?: boolean;
    companyName?: string | null;
    contactName?: string | null;
    contactEmail?: string | null;
    nextAction?: string | null;
    overallFit?: string | null;
    exportType?: string | null;
  };
};

const openQuestion =
  "Contame en un mensaje o audio que hace tu empresa, si ya vende al exterior y que queres evaluar con Anden.";

const routingQuestionOrder = [
  "exportRevenueRange",
  "billing",
  "collection",
  "recurringRevenue",
  "teamSize",
  "companyName",
  "contactName",
  "contactRole",
  "contactEmail",
  "activityType",
  "exportType",
  "exportsToday",
  "countries",
  "consultationMotive"
];

const consentlessFields = [
  "processingConsent",
  "handoffConsent",
  "contactConsent"
];

function normalize(text: string) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");
}

function accepted(text: string) {
  const value = normalize(text).trim();
  return ["si", "ok", "acepto", "continuar", "dale", "confirmar"].includes(
    value
  );
}

function declined(text: string) {
  const value = normalize(text).trim();
  return ["no", "no gracias", "rechazo", "prefiero no", "no acepto"].includes(
    value
  );
}

function extractCountries(text: string) {
  const value = normalize(text);
  const countries: string[] = [];
  if (value.includes("estados unidos") || value.includes("usa")) {
    countries.push("United States");
  }
  if (value.includes("chile")) countries.push("Chile");
  if (value.includes("uruguay")) countries.push("Uruguay");
  if (value.includes("europa")) countries.push("Europe");
  return countries;
}

function extractCaseDescription(text: string): Partial<ReadinessInput> {
  const value = normalize(text);
  const softwareSignal =
    value.includes("saas") ||
    value.includes("software") ||
    value.includes("servicio") ||
    value.includes("digital");
  const goodsSignal =
    value.includes("bienes") ||
    value.includes("mercaderia") ||
    value.includes("producto fisico");
  const exportsSignal =
    value.includes("export") ||
    value.includes("vende al exterior") ||
    value.includes("clientes internacionales");
  const futureSignal =
    value.includes("queremos exportar") ||
    value.includes("pipeline internacional") ||
    value.includes("clientes en negociacion");
  const noCompanySignal =
    value.includes("no tengo empresa") ||
    value.includes("soy persona fisica") ||
    value.includes("todavia no tengo operacion");
  const nonArgentinaSignal =
    (value.includes("empresa chilena") ||
      value.includes("empresa uruguaya") ||
      value.includes("empresa de chile") ||
      value.includes("empresa de uruguay") ||
      value.includes("no es argentina")) &&
    !value.includes("argentina");
  const adviceSignal =
    value.includes("asesoramiento legal") ||
    value.includes("asesoramiento fiscal") ||
    value.includes("asesoramiento contable") ||
    value.includes("decime si me conviene") ||
    value.includes("que impuesto");

  return {
    activityType: goodsSignal
      ? "goods"
      : softwareSignal
        ? "services_software"
        : "unknown",
    exportType: goodsSignal
      ? "goods"
      : softwareSignal
        ? "services_software"
        : "unknown",
    exportsToday: exportsSignal ? true : futureSignal ? false : null,
    futureExportSignals: futureSignal ? ["free_text_future_export_signal"] : [],
    countries: extractCountries(text),
    consultationMotive: value.includes("zona franca")
      ? "Evaluar zona franca"
      : value.includes("anden")
        ? "Conversar con Anden"
        : null,
    riskSignals: [
      ...(adviceSignal ? ["direct_advice_request"] : []),
      ...(noCompanySignal ? ["no_company_or_commercial_operation"] : []),
      ...(nonArgentinaSignal ? ["non_argentina_company"] : [])
    ]
  };
}

function extractEmail(text: string) {
  return text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0] ?? null;
}

function promptForField(field: string) {
  const prompts: Record<string, string> = {
    companyName: "Cual es el nombre de la empresa?",
    contactName: "Con quien deberia quedar asociado el caso?",
    contactRole: "Que rol tenes en la empresa?",
    contactEmail: "Cual es tu email de contacto?",
    exportRevenueRange:
      "Que rango exportaron en USD en los ultimos 12 meses? Opciones: No exportamos aun, < USD 10k, USD 10k - 50k, USD 50k - 250k, USD 250k - 1M, USD 1M+, prefiero no responder.",
    billing:
      "Como facturan esas ventas? Factura E/exportacion, factura local, invoice del exterior, mixto o no se.",
    collection:
      "Desde donde cobran esos clientes? Banco en Argentina, cuenta del exterior, fintech/procesador, mixto o no se.",
    recurringRevenue: "Esos ingresos internacionales son recurrentes?",
    teamSize: "Aproximadamente cuantas personas integran el equipo operativo?",
    activityType: "La actividad principal es servicios/software, bienes o mixta?",
    exportType: "La exportacion es de servicios/software, bienes, mixta o ninguna?",
    exportsToday: "La empresa ya vende al exterior hoy?",
    countries: "A que paises vende o apunta vender?",
    consultationMotive: "Que quiere evaluar puntualmente con Anden?"
  };
  return prompts[field] ?? `Necesito completar este dato: ${field}.`;
}

function mapSimpleAnswerToFields(text: string): Partial<ReadinessInput> {
  const value = normalize(text);
  const email = extractEmail(text);
  const fields: Partial<ReadinessInput> = {};

  if (email) fields.contactEmail = email.toLowerCase();
  if (value.includes("empresa:")) {
    fields.companyName = text.split(/empresa:/i)[1]?.trim() ?? null;
  }
  if (value.includes("mi empresa es")) {
    fields.companyName = text.split(/mi empresa es/i)[1]?.trim() ?? null;
  }
  if (value.includes("me llamo")) {
    fields.contactName = text.split(/me llamo/i)[1]?.trim() ?? null;
  }
  if (value.includes("soy founder") || value.includes("soy fundador")) {
    fields.contactRole = "Founder";
  }
  if (value.includes("soy ceo")) fields.contactRole = "CEO";
  if (value.includes("personas") || value.includes("equipo")) {
    fields.teamSize = text.trim();
  }
  if (value.includes("no exportamos")) fields.exportRevenueRange = "no_exports";
  if (value.includes("< usd 10k") || value.includes("menos de usd 10k")) {
    fields.exportRevenueRange = "lt_usd_10k";
  }
  if (value.includes("usd 10k") || value.includes("10k - 50k")) {
    fields.exportRevenueRange = "usd_10k_50k";
  }
  if (value.includes("usd 50k") || value.includes("50k - 250k")) {
    fields.exportRevenueRange = "usd_50k_250k";
  }
  if (value.includes("usd 250k") || value.includes("250k - 1m")) {
    fields.exportRevenueRange = "usd_250k_1m";
  }
  if (value.includes("usd 1m") || value.includes("1m+")) {
    fields.exportRevenueRange = "usd_1m_plus";
  }
  if (value.includes("factura e")) fields.billing = "factura_e_exportacion";
  if (value.includes("factura local")) fields.billing = "factura_local";
  if (value.includes("invoice")) fields.billing = "invoice_exterior";
  if (value.includes("banco en argentina")) fields.collection = "banco_argentina";
  if (value.includes("cuenta del exterior")) {
    fields.collection = "cuenta_banco_exterior";
  }
  if (value.includes("fintech") || value.includes("procesador")) {
    fields.collection = "fintech_procesador_internacional";
  }
  if (value.includes("recurrente") || value === "si") fields.recurringRevenue = true;
  if (value.includes("no son recurrentes")) fields.recurringRevenue = false;

  return fields;
}

function missingPrompts(fields: Partial<ReadinessInput>) {
  const validation = validateCriticalData(fields);
  const filtered = validation.missingCriticalFields.filter(
    (field) => !consentlessFields.includes(field)
  );
  const ordered = [...filtered].sort(
    (a, b) =>
      routingQuestionOrder.indexOf(a) - routingQuestionOrder.indexOf(b)
  );
  return {
    fields: ordered,
    prompts: ordered.slice(0, 3).map(promptForField)
  };
}

function mergeFields(
  current: IntakeSessionSnapshot["extractedFields"],
  patch: Partial<ReadinessInput> & Record<string, unknown>
) {
  const riskSignals = [
    ...((current.riskSignals as string[] | undefined) ?? []),
    ...((patch.riskSignals as string[] | undefined) ?? [])
  ];
  const merged: Partial<ReadinessInput> & Record<string, unknown> = {
    ...current,
    ...patch,
    consents: {
      ...((current.consents as ReadinessInput["consents"]) ?? {}),
      ...((patch.consents as ReadinessInput["consents"]) ?? {})
    }
  };

  if (riskSignals.length > 0) merged.riskSignals = riskSignals;

  return merged;
}

function hasContactSeed(fields: Partial<ReadinessInput>) {
  return Boolean(
    fields.contactEmail ||
      fields.contactName ||
      fields.contactRole ||
      fields.companyName
  );
}

function contactFieldsMissing(fields: string[]) {
  return fields.some((field) =>
    ["companyName", "contactName", "contactRole", "contactEmail"].includes(field)
  );
}

function isOutOfScope(fields: Partial<ReadinessInput>) {
  const risks = fields.riskSignals ?? [];
  if (fields.activityType === "goods" || fields.exportType === "goods") {
    return "goods_only";
  }
  if (risks.includes("direct_advice_request")) return "direct_advice_request";
  if (risks.includes("no_company_or_commercial_operation")) {
    return "no_company_or_commercial_operation";
  }
  if (risks.includes("non_argentina_company")) return "non_argentina_company";
  return null;
}

function buildConfirmationSummary(fields: Partial<ReadinessInput>) {
  return [
    "Resumen para confirmar:",
    "",
    "Empresa y contacto",
    `Empresa: ${fields.companyName ?? "pendiente"}`,
    `Contacto: ${fields.contactName ?? "pendiente"} (${fields.contactRole ?? "rol pendiente"})`,
    `Email: ${fields.contactEmail ?? "pendiente"}`,
    "",
    "Operacion internacional",
    `Actividad: ${fields.activityType ?? "pendiente"}`,
    `Exporta hoy: ${
      fields.exportsToday === true
        ? "si"
        : fields.exportsToday === false
          ? "no"
          : "pendiente"
    }`,
    `Rango exportado: ${fields.exportRevenueRange ?? "pendiente"}`,
    `Paises: ${(fields.countries ?? []).join(", ") || "pendiente"}`,
    "",
    "Documentacion declarada",
    JSON.stringify(fields.declaredDocumentation ?? {}),
    "",
    "Responde confirmar si esta correcto, o corregir: campo = valor."
  ].join("\n");
}

function parseSignalAnswer(text: string, fields: Partial<ReadinessInput>) {
  const value = normalize(text);
  const extras = { ...(fields as Record<string, unknown>) };

  if (value.includes("mipyme") || extras.mipymeCertificate === undefined) {
    extras.mipymeCertificate = accepted(text)
      ? "declared_yes"
      : declined(text)
        ? "declared_no"
        : "declared_unknown";
  }

  if (
    value.includes("economia del conocimiento") ||
    value.includes("edc") ||
    extras.knowledgeEconomyRegistry === undefined
  ) {
    extras.knowledgeEconomyRegistry = accepted(text)
      ? "declared_yes"
      : declined(text)
        ? "declared_no"
        : "declared_unknown";
  }

  return extras as Partial<ReadinessInput> & Record<string, unknown>;
}

function parseDocumentationAnswer(text: string, fields: Partial<ReadinessInput>) {
  const value = normalize(text);
  const positive = accepted(text) || value.includes("tengo") || value.includes("si");
  const unknown = value.includes("no se") || value.includes("no estoy seguro");
  const state: DocumentState = unknown
    ? "declared_unknown"
    : positive
      ? "declared_available"
      : "declared_unavailable";

  return {
    ...fields,
    declaredDocumentation: {
      ...(fields.declaredDocumentation ?? {}),
      exportInvoices: state,
      revenueSummary: state,
      contracts: state
    }
  };
}

function parseCorrection(text: string): Partial<ReadinessInput> {
  const [, field, value] =
    text.match(/corregir:\s*([a-zA-Z_]+)\s*=\s*(.+)$/i) ??
    text.match(/([a-zA-Z_]+)\s*=\s*(.+)$/i) ??
    [];

  if (!field || !value) return {};

  const trimmedValue = value.trim();

  if (field === "email" || field === "contactEmail") {
    return { contactEmail: extractEmail(trimmedValue) ?? trimmedValue };
  }
  if (field === "empresa" || field === "companyName") {
    return { companyName: trimmedValue };
  }
  if (field === "contacto" || field === "contactName") {
    return { contactName: trimmedValue };
  }
  if (field === "rol" || field === "contactRole") {
    return { contactRole: trimmedValue };
  }

  return {};
}

function leadPatchFromFields(
  fields: Partial<ReadinessInput>
): IntakeResult["leadCasePatch"] {
  return {
    processingConsent: Boolean(fields.consents?.processing),
    handoffConsent: Boolean(fields.consents?.handoff),
    contactConsent: Boolean(fields.consents?.contact),
    companyName: fields.companyName ?? null,
    contactName: fields.contactName ?? null,
    contactEmail: fields.contactEmail ?? null,
    exportType: fields.exportType ?? null
  };
}

function askForNextMissing(fields: Partial<ReadinessInput>): IntakeResult {
  const { fields: missingFields, prompts } = missingPrompts(fields);
  const state =
    contactFieldsMissing(missingFields) && hasContactSeed(fields)
      ? "collecting_contact"
      : "collecting_missing_info";

  return {
    replies: prompts,
    sessionPatch: {
      state,
      currentStep: contactFieldsMissing(missingFields)
        ? "contact_info"
        : "missing_info",
      extractedFields: fields
    },
    missingCriticalFields: missingFields,
    leadCasePatch: leadPatchFromFields(fields)
  };
}

export function handleTextIntake({
  session,
  text
}: {
  session: IntakeSessionSnapshot | null;
  text: string;
}): IntakeResult {
  if (!session || text.trim() === "/start") {
    return {
      replies: [
        "Soy legalfit. Te ayudo a ordenar tu caso para una posible revision profesional con Anden. no doy asesoramiento legal, fiscal ni contable. Para avanzar, voy a procesar tus respuestas y, si envias audio, transcribirlo. Queres continuar?"
      ],
      sessionPatch: {
        state: "awaiting_processing_consent",
        currentStep: "processing_consent",
        extractedFields: {}
      },
      missingCriticalFields: []
    };
  }

  if (session.state === "awaiting_processing_consent") {
    if (!accepted(text)) {
      return {
        replies: [
          "Sin ese consentimiento no puedo avanzar con el intake. Podes volver cuando quieras."
        ],
        sessionPatch: {
          ...session,
          state: "closed_no_handoff",
          currentStep: "processing_consent_refused"
        },
        missingCriticalFields: [],
        leadCasePatch: { lifecycleState: "closed_no_handoff" }
      };
    }

    const extractedFields = mergeFields(session.extractedFields, {
      consents: { processing: true }
    });

    return {
      replies: [openQuestion],
      sessionPatch: {
        state: "collecting_case_description",
        currentStep: "case_description",
        extractedFields
      },
      missingCriticalFields: [],
      leadCasePatch: {
        ...leadPatchFromFields(extractedFields),
        lifecycleState: "collecting_info"
      }
    };
  }

  if (session.state === "awaiting_handoff_consent") {
    if (accepted(text)) {
      const confirmedFields = mergeFields(session.extractedFields, {
        consents: { handoff: true, contact: true }
      });

      return {
        replies: [
          "Listo. Voy a preparar el dossier para compartirlo con Anden y habilitar el contacto."
        ],
        sessionPatch: {
          state: "confirmed_profile",
          currentStep: "handoff_consented",
          extractedFields: confirmedFields
        },
        missingCriticalFields: [],
        leadCasePatch: {
          ...leadPatchFromFields(confirmedFields),
          lifecycleState: "generating_dossier"
        }
      };
    }

    return {
      replies: [
        "No voy a compartir tus datos con Anden. Te dejo un resumen basico y un checklist para que puedas retomarlo mas adelante.",
        buildConfirmationSummary(session.extractedFields)
      ],
      sessionPatch: {
        state: "closed_no_handoff",
        currentStep: "handoff_refused",
        extractedFields: mergeFields(session.extractedFields, {
          consents: { handoff: false, contact: false }
        })
      },
      missingCriticalFields: [],
      leadCasePatch: { lifecycleState: "closed_no_handoff" }
    };
  }

  if (session.state === "collecting_case_description") {
    const extractedFields = mergeFields(
      session.extractedFields,
      extractCaseDescription(text)
    );
    const outOfScopeReason = isOutOfScope(extractedFields);

    if (outOfScopeReason === "goods_only") {
      return {
        replies: [
          "Por ahora el MVP de legalfit esta enfocado en servicios/software. Si queres, puedo tomar una descripcion minima para que Anden decida si corresponde seguimiento manual."
        ],
        sessionPatch: {
          state: "awaiting_minimal_capture_consent",
          currentStep: "out_of_scope_goods",
          extractedFields
        },
        missingCriticalFields: [],
        leadCasePatch: {
          ...leadPatchFromFields(extractedFields),
          lifecycleState: "out_of_scope",
          nextAction: "out_of_scope",
          overallFit: "low"
        }
      };
    }

    if (outOfScopeReason) {
      return {
        replies: [
          "Ese caso queda fuera del alcance del MVP. legalfit solo ordena informacion para una posible revision profesional de empresas argentinas de servicios/software; no doy asesoramiento legal, fiscal ni contable."
        ],
        sessionPatch: {
          state: "out_of_scope",
          currentStep: outOfScopeReason,
          extractedFields
        },
        missingCriticalFields: [],
        leadCasePatch: {
          ...leadPatchFromFields(extractedFields),
          lifecycleState: "out_of_scope",
          nextAction: "out_of_scope",
          overallFit: "low"
        }
      };
    }

    return askForNextMissing(extractedFields);
  }

  if (
    session.state === "collecting_missing_info" ||
    session.state === "collecting_contact"
  ) {
    const extractedFields = mergeFields(
      session.extractedFields,
      mapSimpleAnswerToFields(text)
    );
    const { fields } = missingPrompts(extractedFields);

    if (fields.length > 0) {
      return askForNextMissing(extractedFields);
    }

    return {
      replies: ["Tenes Certificado MiPyME vigente? Responde si, no o no se."],
      sessionPatch: {
        state: "collecting_signals",
        currentStep: "mipyme_signal",
        extractedFields
      },
      missingCriticalFields: [],
      leadCasePatch: leadPatchFromFields(extractedFields)
    };
  }

  if (session.state === "collecting_signals") {
    const extractedFields = parseSignalAnswer(text, session.extractedFields);

    if (session.currentStep === "mipyme_signal") {
      return {
        replies: [
          "Esta inscripta o aplico al regimen de Economia del Conocimiento? Responde si, no o no se."
        ],
        sessionPatch: {
          state: "collecting_signals",
          currentStep: "knowledge_economy_signal",
          extractedFields
        },
        missingCriticalFields: [],
        leadCasePatch: leadPatchFromFields(extractedFields)
      };
    }

    return {
      replies: [
        "Sin subir archivos: declara si tienen disponibles facturas E/exportacion, resumen de cobros y contratos/SOW principales."
      ],
      sessionPatch: {
        state: "collecting_documentation",
        currentStep: "declared_documentation",
        extractedFields
      },
      missingCriticalFields: [],
      leadCasePatch: leadPatchFromFields(extractedFields)
    };
  }

  if (session.state === "collecting_documentation") {
    const extractedFields = parseDocumentationAnswer(text, session.extractedFields);

    return {
      replies: [buildConfirmationSummary(extractedFields)],
      sessionPatch: {
        state: "awaiting_confirmation",
        currentStep: "profile_confirmation",
        extractedFields
      },
      missingCriticalFields: [],
      leadCasePatch: leadPatchFromFields(extractedFields)
    };
  }

  if (session.state === "awaiting_confirmation") {
    if (accepted(text)) {
      return {
        replies: [
          "Para terminar: autorizas compartir este dossier con Anden y que Anden te contacte por este caso?"
        ],
        sessionPatch: {
          state: "awaiting_handoff_consent",
          currentStep: "handoff_consent",
          extractedFields: {
            ...session.extractedFields,
            profileConfirmed: true
          }
        },
        missingCriticalFields: [],
        leadCasePatch: {
          ...leadPatchFromFields(session.extractedFields),
          lifecycleState: "awaiting_consent"
        }
      };
    }

    const correction = parseCorrection(text);
    if (Object.keys(correction).length > 0) {
      const extractedFields = mergeFields(session.extractedFields, correction);

      return {
        replies: [buildConfirmationSummary(extractedFields)],
        sessionPatch: {
          state: "awaiting_confirmation",
          currentStep: "profile_confirmation",
          extractedFields
        },
        missingCriticalFields: [],
        leadCasePatch: leadPatchFromFields(extractedFields)
      };
    }

    return {
      replies: [
        "Responde confirmar si esta correcto, o corregir: campo = valor."
      ],
      sessionPatch: session,
      missingCriticalFields: [],
      leadCasePatch: leadPatchFromFields(session.extractedFields)
    };
  }

  return {
    replies: [
      "El caso quedo en un estado cerrado o pendiente de operacion interna. Podes iniciar de nuevo con /start."
    ],
    sessionPatch: session,
    missingCriticalFields: [],
    leadCasePatch: leadPatchFromFields(session.extractedFields)
  };
}
