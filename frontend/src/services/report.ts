// ReportService — generates a beautiful, vet-ready PDF entirely on-device using
// expo-print (native HTML -> PDF) and shares it with expo-sharing. The weight
// chart is rendered as an inline SVG so it embeds crisply without a chart lib.

import { Platform } from "react-native";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { Pet, Medication, LogEntry, Photo } from "@/src/models/types";
import { SPECIES_TEMPLATES } from "@/src/constants/species";
import {
  buildWeightSeries,
  computeAdherence,
  symptomFrequency,
} from "@/src/services/trends";

export interface ReportOptions {
  rangeDays: number;
  includeWeight: boolean;
  includeMeds: boolean;
  includeSymptoms: boolean;
  includePhotos: boolean;
  includeLogs: boolean;
}

const C = {
  brand: "#2E5A3C",
  terracotta: "#D87B5B",
  ink: "#1A1D1A",
  sub: "#5A5F54",
  line: "#E6E0D4",
  paper: "#FAF9F6",
  tint: "#EBF0EC",
};

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}
function fmtDateTime(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

// Minimal inline SVG line chart with a goal line — keeps the PDF self-contained.
function weightChartSvg(
  series: { value: number; dateIso: string }[],
  goal?: number | null,
): string {
  if (series.length < 2) return "";
  const W = 720, H = 240, P = 36;
  const values = series.map((s) => s.value);
  const min = Math.min(...values, goal ?? Infinity);
  const max = Math.max(...values, goal ?? -Infinity);
  const span = max - min || 1;
  const x = (i: number) => P + (i * (W - P * 2)) / (series.length - 1);
  const y = (v: number) => H - P - ((v - min) / span) * (H - P * 2);
  const points = series.map((s, i) => `${x(i)},${y(s.value)}`).join(" ");
  const goalLine =
    goal != null
      ? `<line x1="${P}" y1="${y(goal)}" x2="${W - P}" y2="${y(goal)}" stroke="${C.terracotta}" stroke-width="2" stroke-dasharray="6 5"/>
         <text x="${W - P}" y="${y(goal) - 6}" fill="${C.terracotta}" font-size="13" text-anchor="end">Goal ${goal}g</text>`
      : "";
  const dots = series
    .map((s, i) => `<circle cx="${x(i)}" cy="${y(s.value)}" r="3.5" fill="${C.brand}"/>`)
    .join("");
  return `<svg width="100%" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
    <rect x="0" y="0" width="${W}" height="${H}" fill="#FFFFFF" stroke="${C.line}" rx="10"/>
    ${goalLine}
    <polyline points="${points}" fill="none" stroke="${C.brand}" stroke-width="3" stroke-linejoin="round"/>
    ${dots}
    <text x="${P}" y="${H - 10}" fill="${C.sub}" font-size="12">${fmtDate(series[0].dateIso)}</text>
    <text x="${W - P}" y="${H - 10}" fill="${C.sub}" font-size="12" text-anchor="end">${fmtDate(series[series.length - 1].dateIso)}</text>
  </svg>`;
}

export function buildReportHtml(
  pet: Pet,
  meds: Medication[],
  logs: LogEntry[],
  photos: Photo[],
  opts: ReportOptions,
): string {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - opts.rangeDays);
  const cutoffIso = cutoff.toISOString();
  const rangedLogs = logs.filter((l) => l.loggedAt >= cutoffIso);
  const template = SPECIES_TEMPLATES[pet.species];

  const weightSeries = buildWeightSeries(rangedLogs);
  const adherence = computeAdherence(logs, meds, opts.rangeDays);
  const symptoms = symptomFrequency(logs, opts.rangeDays);
  const activeMeds = meds.filter((m) => m.active);

  const medRows = activeMeds
    .map(
      (m) => `<tr>
        <td><strong>${m.name}</strong></td>
        <td>${m.dosage} ${m.unit}</td>
        <td>${m.route}</td>
        <td>${m.frequencyPerDay}× daily<br/><span class="sub">${m.times.join(", ")}</span></td>
      </tr>`,
    )
    .join("");

  const adhRows = adherence.perMed
    .map(
      (m) => `<tr>
        <td>${m.name}</td>
        <td>${m.taken} / ${m.expected}</td>
        <td><strong>${Math.round(m.rate * 100)}%</strong></td>
      </tr>`,
    )
    .join("");

  const symptomRows = symptoms
    .map((s) => `<li><strong>${s.symptom}</strong> — logged ${s.count}×</li>`)
    .join("");

  const logRows = rangedLogs
    .slice()
    .sort((a, b) => b.loggedAt.localeCompare(a.loggedAt))
    .slice(0, 40)
    .map((l) => {
      let detail = "";
      if (l.type === "weight") detail = `Weight: <strong>${l.weightGrams} g</strong>`;
      else if (l.type === "medication") detail = `Medication: ${l.medicationName} — ${l.dosageGiven}`;
      else if (l.type === "symptom") detail = `Symptom: ${l.symptom}${l.severity ? ` (severity ${l.severity}/5)` : ""}${l.energyLevel ? `, energy ${l.energyLevel}/5` : ""}`;
      else if (l.type === "husbandry") detail = `Husbandry: ${l.tempF ?? "—"}°F, ${l.humidity ?? "—"}% RH`;
      else detail = "Note";
      const note = l.note ? `<div class="sub">${l.note}</div>` : "";
      return `<tr><td class="sub" style="white-space:nowrap">${fmtDateTime(l.loggedAt)}</td><td>${detail}${note}</td></tr>`;
    })
    .join("");

  const photoCards = opts.includePhotos
    ? photos
        .filter((p) => p.takenAt >= cutoffIso)
        .slice(0, 6)
        .map(
          (p) => `<div class="photo">
            <img src="${p.uri}" />
            <div class="sub">${p.category} · ${fmtDate(p.takenAt)}${p.note ? ` · ${p.note}` : ""}</div>
          </div>`,
        )
        .join("")
    : "";

  const chart =
    opts.includeWeight && weightSeries.length >= 2
      ? `<div class="card"><h3>Weight Trend</h3>${weightChartSvg(
          weightSeries,
          pet.weightGoalGrams,
        )}</div>`
      : "";

  return `<!DOCTYPE html><html><head><meta charset="utf-8"/>
  <style>
    * { box-sizing: border-box; }
    body { font-family: -apple-system, Helvetica, Arial, sans-serif; color: ${C.ink}; margin: 0; padding: 36px 40px; background: ${C.paper}; }
    .header { border-bottom: 3px solid ${C.brand}; padding-bottom: 16px; margin-bottom: 24px; }
    .title { font-size: 30px; font-weight: 800; color: ${C.brand}; margin: 0; }
    .subtitle { color: ${C.sub}; font-size: 14px; margin-top: 6px; }
    .pill { display:inline-block; background:${C.tint}; color:${C.brand}; padding:4px 10px; border-radius:999px; font-size:12px; margin:2px 4px 2px 0; }
    .card { background:#fff; border:1px solid ${C.line}; border-radius:12px; padding:18px 20px; margin-bottom:18px; }
    h3 { color:${C.ink}; font-size:17px; margin:0 0 12px; }
    table { width:100%; border-collapse:collapse; font-size:13px; }
    th { text-align:left; color:${C.sub}; font-weight:600; border-bottom:2px solid ${C.line}; padding:8px 6px; }
    td { padding:9px 6px; border-bottom:1px solid ${C.line}; vertical-align:top; }
    .sub { color:${C.sub}; font-size:12px; }
    .grid { display:flex; flex-wrap:wrap; gap:10px; }
    .photo { width:31%; }
    .photo img { width:100%; height:120px; object-fit:cover; border-radius:8px; border:1px solid ${C.line}; }
    .stat { display:inline-block; width:31%; }
    .statval { font-size:24px; font-weight:800; color:${C.brand}; }
    .disclaimer { margin-top:24px; padding:14px 16px; background:${C.tint}; border-radius:10px; font-size:11px; color:${C.sub}; }
  </style></head><body>
  <div class="header">
    <p class="title">CritterVitals — Health Report</p>
    <p class="subtitle">${pet.name} · ${template.label}${pet.morph ? ` (${pet.morph})` : ""} · Last ${opts.rangeDays} days · Generated ${fmtDate(new Date().toISOString())}</p>
  </div>

  <div class="card">
    <h3>Patient Summary</h3>
    <div>${pet.chronicConditions.map((c) => `<span class="pill">${c}</span>`).join("") || '<span class="sub">No chronic conditions recorded.</span>'}</div>
    <div style="margin-top:14px;">
      <span class="stat"><div class="sub">Latest weight</div><div class="statval">${weightSeries.length ? weightSeries[weightSeries.length - 1].value + " g" : "—"}</div></span>
      <span class="stat"><div class="sub">Weight goal</div><div class="statval">${pet.weightGoalGrams ?? "—"} g</div></span>
      <span class="stat"><div class="sub">Adherence</div><div class="statval">${adherence.expected ? Math.round(adherence.rate * 100) + "%" : "—"}</div></span>
    </div>
    ${pet.notes ? `<p class="sub" style="margin-top:12px">${pet.notes}</p>` : ""}
  </div>

  ${opts.includeMeds && medRows ? `<div class="card"><h3>Current Medications</h3><table><thead><tr><th>Medication</th><th>Dose</th><th>Route</th><th>Schedule</th></tr></thead><tbody>${medRows}</tbody></table></div>` : ""}

  ${chart}

  ${opts.includeMeds && adhRows ? `<div class="card"><h3>Medication Adherence (${opts.rangeDays}d)</h3><table><thead><tr><th>Medication</th><th>Taken / Expected</th><th>Rate</th></tr></thead><tbody>${adhRows}</tbody></table></div>` : ""}

  ${opts.includeSymptoms && symptomRows ? `<div class="card"><h3>Symptoms Observed</h3><ul>${symptomRows}</ul></div>` : ""}

  ${photoCards ? `<div class="card"><h3>Photos</h3><div class="grid">${photoCards}</div></div>` : ""}

  ${opts.includeLogs && logRows ? `<div class="card"><h3>Recent Activity</h3><table><tbody>${logRows}</tbody></table></div>` : ""}

  <div class="disclaimer"><strong>Disclaimer:</strong> CritterVitals is a tracking tool only and does not provide veterinary or medical advice. This report summarizes owner-recorded observations to support a conversation with a qualified exotic-pet veterinarian.</div>
  </body></html>`;
}

export async function generateAndShareReport(
  pet: Pet,
  meds: Medication[],
  logs: LogEntry[],
  photos: Photo[],
  opts: ReportOptions,
): Promise<{ ok: boolean; uri?: string; error?: string }> {
  try {
    const html = buildReportHtml(pet, meds, logs, photos, opts);
    const { uri } = await Print.printToFileAsync({ html, base64: false });
    if (Platform.OS === "web") {
      // Web preview: open the generated PDF in a new tab.
      return { ok: true, uri };
    }
    const canShare = await Sharing.isAvailableAsync();
    if (canShare) {
      await Sharing.shareAsync(uri, {
        mimeType: "application/pdf",
        dialogTitle: `${pet.name} — Vet Report`,
        UTI: "com.adobe.pdf",
      });
    }
    return { ok: true, uri };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed to generate report" };
  }
}
