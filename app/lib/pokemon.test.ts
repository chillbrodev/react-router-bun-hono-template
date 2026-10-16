import {
  combineMatchups,
  formatDexNumber,
  formatMultiplier,
  formatName,
  formatStatName,
  idFromUrl,
  isPokemonType,
} from "./pokemon";

describe("pokemon helpers", () => {
  test("idFromUrl extracts the trailing id", () => {
    expect(idFromUrl("https://pokeapi.co/api/v2/pokemon-species/25/")).toBe(25);
    expect(idFromUrl("https://pokeapi.co/api/v2/pokemon/10080")).toBe(10080);
    expect(() => idFromUrl("https://pokeapi.co/api/v2/type/")).toThrow();
  });

  test("formatDexNumber pads to four digits", () => {
    expect(formatDexNumber(1)).toBe("#0001");
    expect(formatDexNumber(1025)).toBe("#1025");
  });

  test("formatName title-cases hyphenated names", () => {
    expect(formatName("mr-mime")).toBe("Mr Mime");
    expect(formatName("pikachu")).toBe("Pikachu");
  });

  test("formatStatName uses short labels", () => {
    expect(formatStatName("special-attack")).toBe("Sp. Atk");
    expect(formatStatName("hp")).toBe("HP");
  });

  test("isPokemonType only accepts the 18 battle types", () => {
    expect(isPokemonType("fire")).toBe(true);
    expect(isPokemonType("shadow")).toBe(false);
    expect(isPokemonType(null)).toBe(false);
  });
});

describe("combineMatchups", () => {
  const none = {
    double_damage_from: [],
    half_damage_from: [],
    no_damage_from: [],
  };

  test("multiplies dual-type relations (Bug/Grass takes 4× from Fire)", () => {
    const bug = { ...none, double_damage_from: [{ name: "fire" }] };
    const grass = {
      ...none,
      double_damage_from: [{ name: "fire" }],
      half_damage_from: [{ name: "water" }],
    };

    const { weak, resistant } = combineMatchups([bug, grass]);

    expect(weak).toEqual([{ type: "fire", multiplier: 4 }]);
    expect(resistant).toEqual([{ type: "water", multiplier: 0.5 }]);
  });

  test("immunity wins over weakness (Normal/Ghost vs Fighting)", () => {
    const normal = { ...none, double_damage_from: [{ name: "fighting" }] };
    const ghost = { ...none, no_damage_from: [{ name: "fighting" }] };

    const { weak, immune } = combineMatchups([normal, ghost]);

    expect(immune).toEqual(["fighting"]);
    expect(weak).toEqual([]);
  });

  test("ignores non-battle types like shadow", () => {
    const relations = { ...none, double_damage_from: [{ name: "shadow" }] };
    expect(combineMatchups([relations]).weak).toEqual([]);
  });

  test("formatMultiplier uses fractions", () => {
    expect(formatMultiplier(0.25)).toBe("¼×");
    expect(formatMultiplier(0.5)).toBe("½×");
    expect(formatMultiplier(4)).toBe("4×");
  });
});
