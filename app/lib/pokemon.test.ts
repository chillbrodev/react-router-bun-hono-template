import {
  formatDexNumber,
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
