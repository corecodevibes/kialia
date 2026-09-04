import { describe, expect, test } from "bun:test";
import { attachmentOwnerIds, newTrip, uid } from "./trip-store";

/**
 * Die Sicherung ist die letzte Rettung, wenn das Geraet weg ist. Getestet wird
 * deshalb nicht, dass sie laeuft, sondern dass sie VOLLSTAENDIG ist: jeder
 * Posten, an dem im UI ein Beleg haengen kann, muss in der Liste stehen.
 * Faellt einer heraus, verschwinden seine Fotos lautlos aus jeder Sicherung —
 * und das merkt man erst, wenn man sie braucht.
 */
describe("attachmentOwnerIds", () => {
  function tripMitAllem() {
    const t = newTrip("Kreta");
    t.transports = [
      { id: "tr1", mode: "Flug", label: "ZRH–CHQ", amount: 0, date: "", status: "open", links: [] },
    ] as typeof t.transports;
    t.stays = [
      {
        id: "st1",
        name: "Chania",
        place: "",
        amount: 0,
        from: "",
        to: "",
        status: "open",
        board: "none",
        links: [],
      },
    ] as typeof t.stays;
    t.activities = [
      { id: "ac1", name: "Samaria", amount: 0, date: "", status: "open", links: [] },
    ] as unknown as typeof t.activities;
    t.packing = [
      { id: "k1", name: "Technik", items: [{ id: "it1", text: "Kamera", done: false }] },
    ];
    return t;
  }

  test("nimmt jede Gattung mit, an der ein Beleg haengen kann", () => {
    const ids = attachmentOwnerIds(tripMitAllem());
    for (const id of ["tr1", "st1", "ac1", "it1"]) expect(ids).toContain(id);
  });

  test("eine frische Reise bringt schon Packstuecke mit — die zaehlen mit", () => {
    // newTrip() legt defaultPacking() an. Die Liste ist also NICHT leer, und
    // das ist richtig so: an einem Standard-Packstueck kann sofort ein Foto
    // haengen. Die erste Fassung dieses Tests erwartete [] und lag damit
    // falsch — nicht der Code.
    const ids = attachmentOwnerIds(newTrip());
    expect(ids.length).toBeGreaterThan(0);
    expect(ids.every((id) => typeof id === "string" && id.length > 0)).toBe(true);
  });

  test("eine wirklich leere Reise ergibt eine leere Liste", () => {
    const t = newTrip();
    t.packing = [];
    expect(attachmentOwnerIds(t)).toEqual([]);
  });

  test("kennt jede Packkategorie, nicht nur die erste", () => {
    const t = newTrip();
    t.packing = [
      { id: "a", name: "A", items: [{ id: "a1", text: "x", done: false }] },
      { id: "b", name: "B", items: [{ id: "b1", text: "y", done: false }] },
    ];
    const ids = attachmentOwnerIds(t);
    expect(ids).toContain("a1");
    expect(ids).toContain("b1");
  });

  test("die ids sind eindeutig — sonst laedt die Sicherung Belege doppelt", () => {
    const ids = attachmentOwnerIds(tripMitAllem());
    expect(new Set(ids).size).toBe(ids.length);
  });

  test("uid liefert unterschiedliche Werte", () => {
    expect(uid()).not.toBe(uid());
  });
});
