import { SUB_UNIT_MAPPING, FLOORS_BY_BUILDING, LANTAI_BY_GEDUNG } from "@/constants";

// --- Navigasi & Path ---

export const getBuildingPath = (gedung: string, lantai?: string): string => {
  const gedungMap: Record<string, string> = {
    Dekanat: "dekanat",
    "Tamansari 1": "tamansari1",
    Kedokteran: "kedokteran",
    Pascasarjana: "pascasarjana",
  };
  const pathGedung = gedungMap[gedung];
  return lantai ? `/${pathGedung}/${lantai}` : `/${pathGedung}`;
};

export const getGedungFromPath = (path: string): string | null => {
  const parts = path.split("/").filter(Boolean);
  if (parts.length === 0) return null;

  const pathMap: Record<string, string> = {
    dekanat: "Dekanat",
    tamansari1: "Tamansari 1",
    kedokteran: "Kedokteran",
    pascasarjana: "Pascasarjana",
  };

  return pathMap[parts[0]] ?? null;
};

export const getLantaiFromPath = (path: string): string | null => {
  const parts = path.split("/").filter(Boolean);
  return parts.length >= 2 ? parts[1] : null;
};

// --- Gedung & Lantai ---

export const getLantaiOptions = (gedung: string) => {
  return LANTAI_BY_GEDUNG[gedung] ?? [];
};

export const getFloorsByBuilding = (building: string | null): string[] => {
  if (!building) return [];
  return FLOORS_BY_BUILDING[building] ?? [];
};

// --- Sub Unit ---

export const getSubUnitsByFakultas = (
  fakultas: string
): Array<{ value: string; label: string }> => {
  return SUB_UNIT_MAPPING[fakultas] ?? [];
};

// --- SVG Loader ---

export const loadSvgContent = async (
  gedung: string,
  lantai?: string
): Promise<string | null> => {
  try {
    let fileName = "";

    if (gedung === "Dekanat") {
      fileName = lantai ? `lantai${lantai}.svg` : "denahv2.svg";
    } else if (gedung === "Kedokteran") {
      const lantaiKey = lantai?.toLowerCase().replace(" ", "_");
      fileName = lantai ? `lantai${lantaiKey}_kedokteran.svg` : "kedokteran.svg";
    } else if (gedung === "Pascasarjana") {
      const lantaiKey = lantai?.toLowerCase().replace(" ", "_");
      fileName = lantai ? `lantai${lantaiKey}_pasca.svg` : "pascasarjana.svg";
    }

    const response = await fetch(`/${fileName}`);
    return await response.text();
  } catch (error) {
    console.error("Gagal load SVG:", error);
    return null;
  }
};

// --- Error Handling ---

export const extractErrorMessage = (error: unknown): string => {
  if (!error) return "Unknown error";
  if (typeof error === "string") return error;

  if (typeof error === "object") {
    const obj = error as Record<string, unknown>;
    if (typeof obj.message === "string") return obj.message;
    if (typeof obj.error === "string") return obj.error;
    if (typeof obj.msg === "string") return obj.msg;
    if (typeof obj.detail === "string") return obj.detail;
    if (typeof obj.description === "string") return obj.description;

    try {
      return JSON.stringify(error);
    } catch {
      return "Unknown error object";
    }
  }

  return String(error);
};

// --- Data Export ---

export const exportToJson = (data: unknown[], filename: string): void => {
  const dataStr = JSON.stringify(data, null, 2);
  const dataUri =
    "data:application/json;charset=utf-8," + encodeURIComponent(dataStr);
  const exportFileName = `${filename}-${new Date().toISOString().split("T")[0]}.json`;

  const linkElement = document.createElement("a");
  linkElement.setAttribute("href", dataUri);
  linkElement.setAttribute("download", exportFileName);
  document.body.appendChild(linkElement);
  linkElement.click();
  document.body.removeChild(linkElement);
};