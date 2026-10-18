import { ConceptMapData } from '../types/conceptMap';

export const DEFAULT_CONCEPT_MAP: ConceptMapData = {
  mapTitle: "Fundamentos del Comercio Internacional",
  rootNodeId: "Root",
  nodes: [
    // NODO RAÍZ
    {
      id: "Root",
      type: "root",
      label: "FUNDAMENTOS DEL COMERCIO INTERNACIONAL",
      description: "Envío y recepción de bienes y servicios entre países para satisfacer demanda global, optimizar recursos y dinamizar las economías nacionales.",
      emoji: "🌐",
      media: {
        type: "youtube_video",
        url: "https://www.youtube.com/watch?v=YdwNrNwo0Ws",
        caption: "Fundamentos y funcionamiento del comercio global"
      },
      style: {
        backgroundColor: "#1A365D",
        textColor: "#FFFFFF",
        borderColor: "#38bdf8"
      }
    },

    // ==========================================
    // RAMA 1: TEORÍAS DEL COMERCIO INTERNACIONAL
    // ==========================================
    {
      id: "T",
      type: "topic",
      label: "1. TEORÍAS DEL COMERCIO INTERNACIONAL",
      description: "Evolución de las doctrinas económicas desde el siglo XVII: del mercantilismo proteccionista a los modelos neotecnológicos.",
      emoji: "📚",
      media: {
        type: "none",
        url: "",
        caption: ""
      },
      style: {
        backgroundColor: "#1E40AF",
        textColor: "#FFFFFF",
        borderColor: "#60A5FA"
      }
    },
    {
      id: "T_Merc",
      type: "subtopic",
      label: "Mercantilismo (S. XVII-XVIII)",
      description: "Doctrina basada en la acumulación de riqueza en metales preciosos (oro y plata), balanza comercial superavitaria y fuerte intervencionismo estatal.",
      emoji: "🪙",
      media: {
        type: "none",
        url: "",
        caption: ""
      },
      style: {
        backgroundColor: "#1e293b",
        textColor: "#f8fafc",
        borderColor: "#64748b"
      }
    },
    {
      id: "T_Abs",
      type: "subtopic",
      label: "Ventaja Absoluta (Adam Smith, 1776)",
      description: "Especialización y exportación del bien donde el país posee un menor costo absoluto de producción respecto al resto del mundo.",
      emoji: "⚖️",
      media: {
        type: "none",
        url: "",
        caption: ""
      },
      style: {
        backgroundColor: "#172554",
        textColor: "#FFFFFF",
        borderColor: "#3b82f6"
      }
    },
    {
      id: "T_Abs_Det",
      type: "detail",
      label: "Postulado y Ejemplos de Ventaja Absoluta",
      description: "- Crítica al mercantilismo: Riqueza = Capacidad de producción y consumo real.\n- Colombia vs Venezuela (Café y Petróleo).\n- EE. UU. (Tecnología aeroespacial).\n- Recursos naturales: Canadá (Madera), Argentina (Carne/Granos), China (Manufactura textil).",
      emoji: "📋",
      media: {
        type: "cloudinary_image",
        url: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=600&q=80",
        caption: "Especialización productiva y división internacional del trabajo"
      },
      style: {
        backgroundColor: "#0f172a",
        textColor: "#e2e8f0",
        borderColor: "#38bdf8"
      }
    },
    {
      id: "T_Comp",
      type: "subtopic",
      label: "Ventaja Comparativa (David Ricardo, 1817)",
      description: "Especialización en el bien con menor costo de oportunidad relativo interno, demostrando beneficios mutuos incluso sin ventaja absoluta.",
      emoji: "📈",
      media: {
        type: "youtube_video",
        url: "https://www.youtube.com/watch?v=38hvvAzg0Y8",
        caption: "Explicación gráfica del costo de oportunidad y ventaja comparativa"
      },
      style: {
        backgroundColor: "#172554",
        textColor: "#FFFFFF",
        borderColor: "#3b82f6"
      }
    },
    {
      id: "T_Comp_Det",
      type: "detail",
      label: "Fundamentos y Críticas a Ricardo",
      description: "- Obra cumbre: 'Principios de Economía Política y Tributación'.\n- Distinción (Pedrosa, 2016): Smith compara costos absolutos externos; Ricardo, eficiencia interna relativa.\n- Fuentes: Clima, dotación de factores e innovación tecnológica.\n- Críticas (Ohlin, Bhagwati): Supuesto de modelo 2x2, trabajo único homogéneo y ausencia de costos de transporte.",
      emoji: "🔍",
      media: {
        type: "none",
        url: "",
        caption: ""
      },
      style: {
        backgroundColor: "#0f172a",
        textColor: "#e2e8f0",
        borderColor: "#38bdf8"
      }
    },
    {
      id: "T_HO",
      type: "subtopic",
      label: "Modelo Heckscher-Ohlin (1977)",
      description: "Teoría de la Proporción de Factores: Los países exportan bienes intensivos en sus factores relativamente abundantes (Tierra, Trabajo, Capital).",
      emoji: "🧩",
      media: {
        type: "none",
        url: "",
        caption: ""
      },
      style: {
        backgroundColor: "#1e1b4b",
        textColor: "#FFFFFF",
        borderColor: "#818cf8"
      }
    },
    {
      id: "T_HO_Teor",
      type: "detail",
      label: "Teoremas Asociados al Modelo H-O",
      description: "- Abundancia de factor = Ventaja comparativa factorial.\n- Teorema Rybczynski: Un aumento en la dotación de un factor eleva más que proporcionalmente la producción del bien intensivo en dicho factor.\n- Teorema Stolper-Samuelson (1941): El alza en el precio de importación incrementa la retribución real al factor escaso en la economía.",
      emoji: "📐",
      media: {
        type: "none",
        url: "",
        caption: ""
      },
      style: {
        backgroundColor: "#0f172a",
        textColor: "#e2e8f0",
        borderColor: "#818cf8"
      }
    },
    {
      id: "T_Neo",
      type: "subtopic",
      label: "Teorías Neotecnológicas (Años 70)",
      description: "La inversión en I+D, la tecnología de punta y el capital humano generan competencia imperfecta y ventajas dinámicas sostenibles.",
      emoji: "⚡",
      media: {
        type: "none",
        url: "",
        caption: ""
      },
      style: {
        backgroundColor: "#1e1b4b",
        textColor: "#FFFFFF",
        borderColor: "#c084fc"
      }
    },
    {
      id: "T_Neo_Mod",
      type: "detail",
      label: "Modelos Dinámicos de Innovación",
      description: "- Desfase Tecnológico (Posner, 1961 / Hufbauer, 1966): Monopolio comercial temporal del país innovador hasta la imitación de terceros.\n- Ciclo de Vida del Producto (Vernon): 5 Etapas (Previa ➔ Introducción ➔ Crecimiento ➔ Madurez ➔ Declive y deslocalización).",
      emoji: "🔄",
      media: {
        type: "none",
        url: "",
        caption: ""
      },
      style: {
        backgroundColor: "#0f172a",
        textColor: "#e2e8f0",
        borderColor: "#c084fc"
      }
    },

    // ==========================================
    // RAMA 2: POLÍTICAS COMERCIALES
    // ==========================================
    {
      id: "P",
      type: "topic",
      label: "2. POLÍTICAS COMERCIALES",
      description: "Conjunto de regulaciones, normativas e incentivos estatales que guían las relaciones de intercambio con agentes económicos externos.",
      emoji: "🏛️",
      media: {
        type: "none",
        url: "",
        caption: ""
      },
      style: {
        backgroundColor: "#065F46",
        textColor: "#FFFFFF",
        borderColor: "#34D399"
      }
    },
    {
      id: "P_Def",
      type: "subtopic",
      label: "Definición y Propósito (Westreicher, 2020)",
      description: "Marco legal e institucional que determina el grado de apertura comercial de una nación frente al exterior.",
      emoji: "📖",
      media: {
        type: "none",
        url: "",
        caption: ""
      },
      style: {
        backgroundColor: "#064e3b",
        textColor: "#FFFFFF",
        borderColor: "#10b981"
      }
    },
    {
      id: "P_Obj",
      type: "detail",
      label: "Objetivos de la Política Comercial",
      description: "- Fortalecimiento de la institucionalidad económica.\n- Incremento del Producto Interno Bruto (PIB).\n- Generación de empleo productivo formal.\n- Optimización de acuerdos y relaciones bilaterales/multilaterales.",
      emoji: "🎯",
      media: {
        type: "none",
        url: "",
        caption: ""
      },
      style: {
        backgroundColor: "#022c22",
        textColor: "#e2e8f0",
        borderColor: "#34d399"
      }
    },
    {
      id: "P_Aran",
      type: "subtopic",
      label: "Instrumentos Arancelarios",
      description: "Medidas tributarias directas sobre el valor o volumen de las mercancías que cruzan las aduanas nacionales.",
      emoji: "🏷️",
      media: {
        type: "none",
        url: "",
        caption: ""
      },
      style: {
        backgroundColor: "#064e3b",
        textColor: "#FFFFFF",
        borderColor: "#10b981"
      }
    },
    {
      id: "P_Aran_Det",
      type: "detail",
      label: "Aranceles y Balanza Comercial",
      description: "- Aranceles: Impuestos a la importación (Ad-valorem, específico o mixto; exigibles ante la ausencia de un Tratado de Libre Comercio).\n- Balanza Comercial: Saldo neto entre exportaciones e importaciones de mercancías (Superávit o Déficit comercial).",
      emoji: "📊",
      media: {
        type: "none",
        url: "",
        caption: ""
      },
      style: {
        backgroundColor: "#022c22",
        textColor: "#e2e8f0",
        borderColor: "#34d399"
      }
    },
    {
      id: "P_NoAran",
      type: "subtopic",
      label: "Barreras No Arancelarias (BNA)",
      description: "Mecanismos administrativos, sanitarios y técnicos que controlan o restringen el flujo de importaciones sin aplicar tributos aduaneros.",
      emoji: "🛡️",
      media: {
        type: "none",
        url: "",
        caption: ""
      },
      style: {
        backgroundColor: "#064e3b",
        textColor: "#FFFFFF",
        borderColor: "#10b981"
      }
    },
    {
      id: "P_NoAran_Det",
      type: "detail",
      label: "Medidas No Arancelarias Específicas",
      description: "- Licencias de Importación: Requisito previo obligatorio (ej. Vistos buenos ICA/MinAgricultura en Colombia).\n- Normas de Origen: Criterios OMC para calificar exenciones de arancel e IVA.\n- Medidas de Normalización: Reglamentos técnicos de rotulado, empaque, calidad y seguridad del consumidor.\n- Medidas Fito y Zoosanitarias: Control riguroso de plagas, bioseguridad alimentaria y riesgos epidemiológicos.",
      emoji: "📜",
      media: {
        type: "none",
        url: "",
        caption: ""
      },
      style: {
        backgroundColor: "#022c22",
        textColor: "#e2e8f0",
        borderColor: "#34d399"
      }
    },
    {
      id: "P_Defensa",
      type: "subtopic",
      label: "Defensa Comercial y Prácticas Desleales",
      description: "Instrumentos jurídicos y económicos destinados a contrarrestar distorsiones artificiales en los precios internacionales.",
      emoji: "⚖️",
      media: {
        type: "none",
        url: "",
        caption: ""
      },
      style: {
        backgroundColor: "#064e3b",
        textColor: "#FFFFFF",
        borderColor: "#10b981"
      }
    },
    {
      id: "P_Defensa_Det",
      type: "detail",
      label: "Sanciones al Dumping y Subvenciones",
      description: "- Dumping: Venta al exterior por debajo del costo o precio interno; contrarrestado con Derechos Antidumping.\n- Subvenciones: Ayudas estatales indebidas a productores locales; neutralizadas mediante Derechos Compensatorios.\n- Salvaguardias Temporales: Restricciones de urgencia ante avalanchas imprevistas de importaciones que amenazan la industria local.",
      emoji: "⚠️",
      media: {
        type: "none",
        url: "",
        caption: ""
      },
      style: {
        backgroundColor: "#022c22",
        textColor: "#e2e8f0",
        borderColor: "#34d399"
      }
    },

    // ==========================================
    // RAMA 3: INSTITUCIONES SUPRANACIONALES
    // ==========================================
    {
      id: "I",
      type: "topic",
      label: "3. INSTITUCIONES SUPRANACIONALES",
      description: "Organismos multilaterales que establecen la gobernanza, supervisión financiera y regulación del comercio global.",
      emoji: "🌐",
      media: {
        type: "none",
        url: "",
        caption: ""
      },
      style: {
        backgroundColor: "#9A3412",
        textColor: "#FFFFFF",
        borderColor: "#FB923C"
      }
    },
    {
      id: "I_FMI",
      type: "subtopic",
      label: "Fondo Monetario Internacional (FMI)",
      description: "Garantiza la estabilidad del sistema financiero y monetario internacional, facilitando la liquidez ante desequilibrios de balanza de pagos.",
      emoji: "🏦",
      media: {
        type: "none",
        url: "",
        caption: ""
      },
      style: {
        backgroundColor: "#7c2d12",
        textColor: "#FFFFFF",
        borderColor: "#ea580c"
      }
    },
    {
      id: "I_FMI_Det",
      type: "detail",
      label: "Estructura y Rol del FMI",
      description: "- Origen: Conferencia de Bretton Woods (1944) con 44 países fundadores | Hoy: 184 países miembros.\n- Rol clave: Estabilidad cambiaría, asistencia técnica y préstamos financieros condicionados a programas de ajuste estructural económico.",
      emoji: "🏛️",
      media: {
        type: "none",
        url: "",
        caption: ""
      },
      style: {
        backgroundColor: "#431407",
        textColor: "#fed7aa",
        borderColor: "#fb923c"
      }
    },
    {
      id: "I_BM",
      type: "subtopic",
      label: "Grupo del Banco Mundial (BM)",
      description: "Institución global de financiamiento destinada a reducir la pobreza y fomentar el desarrollo sostenible en economías emergentes.",
      emoji: "🌍",
      media: {
        type: "none",
        url: "",
        caption: ""
      },
      style: {
        backgroundColor: "#7c2d12",
        textColor: "#FFFFFF",
        borderColor: "#ea580c"
      }
    },
    {
      id: "I_BM_Det",
      type: "detail",
      label: "Filiales y Gobernanza del Banco Mundial",
      description: "- Origen: Fundado en 1945 con fines de reconstrucción europea postguerra.\n- Gobernanza: Junta de Gobernadores, Directorio Ejecutivo, Presidente y Consejo Consultivo.\n- 5 Filiales: BIRF (1945), CFI (1956), AIF (1960), CIADI (1966), OMGI (1988).\n- Rol: Financiamiento de infraestructura, educación, salud pública y transición energética.",
      emoji: "🏗️",
      media: {
        type: "none",
        url: "",
        caption: ""
      },
      style: {
        backgroundColor: "#431407",
        textColor: "#fed7aa",
        borderColor: "#fb923c"
      }
    },
    {
      id: "I_OMC",
      type: "subtopic",
      label: "Organización Mundial del Comercio (OMC)",
      description: "Única organización internacional que se ocupa de las normas que rigen el comercio de mercancías, servicios y propiedad intelectual entre países.",
      emoji: "🕊️",
      media: {
        type: "youtube_video",
        url: "https://www.youtube.com/watch?v=zjkBMFhNj_g",
        caption: "Mecanismo de resolución de diferencias y rondas de negociación de la OMC"
      },
      style: {
        backgroundColor: "#7c2d12",
        textColor: "#FFFFFF",
        borderColor: "#ea580c"
      }
    },
    {
      id: "I_OMC_Det",
      type: "detail",
      label: "Principios, Miembros y Retos de la OMC",
      description: "- Origen: Creada en 1995 (Ronda de Uruguay 1994, sede en Ginebra) | 164 países miembros que representan más del 98% del comercio mundial.\n- Principios rectores: Trato no discriminatorio, Cláusula de Nación Más Favorecida (NMF), Trato Nacional, previsibilidad y apertura.\n- Retos contemporáneos: Estancamiento de la Ronda de Doha, subsidios agrícolas y Conferencia Ministerial de Buenos Aires (Zúñiga Schroder, 2018).",
      emoji: "📑",
      media: {
        type: "none",
        url: "",
        caption: ""
      },
      style: {
        backgroundColor: "#431407",
        textColor: "#fed7aa",
        borderColor: "#fb923c"
      }
    }
  ],
  edges: [
    // RAMA 1: TEORÍAS
    {
      id: "edge-Root-T",
      source: "Root",
      target: "T",
      relationLabel: "1. Marco Teórico e Histórico"
    },
    {
      id: "edge-T-Merc",
      source: "T",
      target: "T_Merc",
      relationLabel: "inicia con"
    },
    {
      id: "edge-T-Abs",
      source: "T",
      target: "T_Abs",
      relationLabel: "superada por"
    },
    {
      id: "edge-T_Abs-T_Abs_Det",
      source: "T_Abs",
      target: "T_Abs_Det",
      relationLabel: "sustentada en"
    },
    {
      id: "edge-T-Comp",
      source: "T",
      target: "T_Comp",
      relationLabel: "evoluciona hacia"
    },
    {
      id: "edge-T_Comp-T_Comp_Det",
      source: "T_Comp",
      target: "T_Comp_Det",
      relationLabel: "desarrollada con"
    },
    {
      id: "edge-T-HO",
      source: "T",
      target: "T_HO",
      relationLabel: "profundizada por"
    },
    {
      id: "edge-T_HO-T_HO_Teor",
      source: "T_HO",
      target: "T_HO_Teor",
      relationLabel: "formalizada mediante"
    },
    {
      id: "edge-T-Neo",
      source: "T",
      target: "T_Neo",
      relationLabel: "modernizada por"
    },
    {
      id: "edge-T_Neo-T_Neo_Mod",
      source: "T_Neo",
      target: "T_Neo_Mod",
      relationLabel: "expuesta en"
    },

    // RAMA 2: POLÍTICAS
    {
      id: "edge-Root-P",
      source: "Root",
      target: "P",
      relationLabel: "2. Regulación e Intervención Estatal"
    },
    {
      id: "edge-P-P_Def",
      source: "P",
      target: "P_Def",
      relationLabel: "se fundamenta en"
    },
    {
      id: "edge-P_Def-P_Obj",
      source: "P_Def",
      target: "P_Obj",
      relationLabel: "orientada hacia"
    },
    {
      id: "edge-P-P_Aran",
      source: "P",
      target: "P_Aran",
      relationLabel: "se ejecuta mediante"
    },
    {
      id: "edge-P_Aran-P_Aran_Det",
      source: "P_Aran",
      target: "P_Aran_Det",
      relationLabel: "comprende"
    },
    {
      id: "edge-P-P_NoAran",
      source: "P",
      target: "P_NoAran",
      relationLabel: "se complementa con"
    },
    {
      id: "edge-P_NoAran-P_NoAran_Det",
      source: "P_NoAran",
      target: "P_NoAran_Det",
      relationLabel: "clasificadas en"
    },
    {
      id: "edge-P-P_Defensa",
      source: "P",
      target: "P_Defensa",
      relationLabel: "protegida mediante"
    },
    {
      id: "edge-P_Defensa-P_Defensa_Det",
      source: "P_Defensa",
      target: "P_Defensa_Det",
      relationLabel: "aplica sanciones como"
    },

    // RAMA 3: INSTITUCIONES
    {
      id: "edge-Root-I",
      source: "Root",
      target: "I",
      relationLabel: "3. Gobernanza y Finanzas Globales"
    },
    {
      id: "edge-I-I_FMI",
      source: "I",
      target: "I_FMI",
      relationLabel: "integrada por"
    },
    {
      id: "edge-I_FMI-I_FMI_Det",
      source: "I_FMI",
      target: "I_FMI_Det",
      relationLabel: "constituida con"
    },
    {
      id: "edge-I-I_BM",
      source: "I",
      target: "I_BM",
      relationLabel: "apoyada por"
    },
    {
      id: "edge-I_BM-I_BM_Det",
      source: "I_BM",
      target: "I_BM_Det",
      relationLabel: "organizada bajo"
    },
    {
      id: "edge-I-I_OMC",
      source: "I",
      target: "I_OMC",
      relationLabel: "regulada por"
    },
    {
      id: "edge-I_OMC-I_OMC_Det",
      source: "I_OMC",
      target: "I_OMC_Det",
      relationLabel: "fundamentada en"
    }
  ]
};

export const SAMPLE_MAP_AI: ConceptMapData = {
  mapTitle: "Inteligencia Artificial y Modelos Generativos",
  rootNodeId: "ai-root",
  nodes: [
    {
      id: "ai-root",
      type: "root",
      label: "Inteligencia Artificial Moderna",
      description: "Sistemas computacionales capaces de emular procesos cognitivos como razonamiento, percepción y generación de contenido.",
      emoji: "🤖",
      media: {
        type: "youtube_video",
        url: "https://www.youtube.com/watch?v=aircAruvnKk",
        caption: "3Blue1Brown: ¿Pero qué es una Red Neuronal?"
      },
      style: {
        backgroundColor: "#312e81",
        textColor: "#ffffff",
        borderColor: "#6366f1"
      }
    },
    {
      id: "ai-ml",
      type: "topic",
      label: "Machine Learning (Aprendizaje Automático)",
      description: "Algoritmos que aprenden patrones directamente de grandes conjuntos de datos sin programación explícita de reglas.",
      emoji: "📊",
      media: {
        type: "none",
        url: "",
        caption: ""
      },
      style: {
        backgroundColor: "#065f46",
        textColor: "#ffffff",
        borderColor: "#10b981"
      }
    },
    {
      id: "ai-dl",
      type: "subtopic",
      label: "Deep Learning (Redes Profundas)",
      description: "Arquitecturas multicapa inspiradas en redes biológicas para extracción jerárquica de características.",
      emoji: "🧠",
      media: {
        type: "cloudinary_image",
        url: "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?auto=format&fit=crop&w=600&q=80",
        caption: "Representación visual de capas y sinapsis artificiales"
      },
      style: {
        backgroundColor: "#1e3a8a",
        textColor: "#ffffff",
        borderColor: "#3b82f6"
      }
    },
    {
      id: "ai-transformers",
      type: "subtopic",
      label: "Arquitectura Transformer",
      description: "Mecanismo de atención (Self-Attention) para procesamiento paralelo masivo en modelos de lenguaje y visión.",
      emoji: "⚡",
      media: {
        type: "none",
        url: "",
        caption: ""
      },
      style: {
        backgroundColor: "#831843",
        textColor: "#ffffff",
        borderColor: "#ec4899"
      }
    },
    {
      id: "ai-llm",
      type: "detail",
      label: "Large Language Models (LLMs)",
      description: "Modelos fundacionales entrenados con billones de parámetros para razonar y generar texto natural y código.",
      emoji: "💬",
      media: {
        type: "youtube_video",
        url: "https://www.youtube.com/watch?v=zjkBMFhNj_g",
        caption: "¿Cómo funcionan los Large Language Models?"
      },
      style: {
        backgroundColor: "#701a75",
        textColor: "#ffffff",
        borderColor: "#c084fc"
      }
    }
  ],
  edges: [
    {
      id: "edge-ai-1",
      source: "ai-root",
      target: "ai-ml",
      relationLabel: "tiene como pilar principal"
    },
    {
      id: "edge-ai-2",
      source: "ai-ml",
      target: "ai-dl",
      relationLabel: "se especializa en"
    },
    {
      id: "edge-ai-3",
      source: "ai-dl",
      target: "ai-transformers",
      relationLabel: "se revoluciona con"
    },
    {
      id: "edge-ai-4",
      source: "ai-transformers",
      target: "ai-llm",
      relationLabel: "da origen a"
    }
  ]
};

export const COLOR_PRESETS = [
  {
    name: "Azul Marino (Raíz)",
    bg: "#1A365D",
    text: "#ffffff",
    border: "#38bdf8",
    level: "root" as const,
  },
  {
    name: "Azul Real (Teorías)",
    bg: "#1E40AF",
    text: "#ffffff",
    border: "#60a5fa",
    level: "topic" as const,
  },
  {
    name: "Esmeralda Vivo (Políticas)",
    bg: "#065F46",
    text: "#ffffff",
    border: "#34d399",
    level: "topic" as const,
  },
  {
    name: "Óxido / Terracota (Instituciones)",
    bg: "#9A3412",
    text: "#ffffff",
    border: "#fb923c",
    level: "topic" as const,
  },
  {
    name: "Púrpura Neotecnológico",
    bg: "#4c1d95",
    text: "#ffffff",
    border: "#c084fc",
    level: "subtopic" as const,
  },
  {
    name: "Cian Océano",
    bg: "#164e63",
    text: "#ffffff",
    border: "#06b6d4",
    level: "subtopic" as const,
  },
  {
    name: "Gris Grafito Minimalista",
    bg: "#1e293b",
    text: "#f8fafc",
    border: "#64748b",
    level: "subtopic" as const,
  },
  {
    name: "Pizarra Noche (Detalle)",
    bg: "#0f172a",
    text: "#e2e8f0",
    border: "#38bdf8",
    level: "detail" as const,
  }
];

export const POPULAR_EMOJIS = [
  "🌐", "📚", "🏛️", "⚖️", "📈", "🌍", "📜", "🪙", "🔍", "🧩",
  "📐", "⚡", "🔄", "🎯", "🏷️", "📊", "🛡️", "⚠️", "🏦", "🏗️",
  "🕊️", "📑", "💡", "🔬", "🚀", "💻", "💎", "⭐", "📌", "🏆"
];
