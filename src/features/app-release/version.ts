/**
 * "1.2.10" biçimindeki sürümleri sayısal olarak karşılaştırır.
 *
 * Metin karşılaştırması yanlış sonuç veriyor: "1.0.10" < "1.0.9" çıkıyor,
 * çünkü karakter karakter bakıyor. Eksik parçalar sıfır sayılır, yani
 * "1.1" ile "1.1.0" eşit.
 */
export function isVersionBelow(current: string, minimum: string): boolean {
  const parse = (value: string) =>
    value
      .trim()
      .split(".")
      .map((part) => Number.parseInt(part, 10))
      .map((part) => (Number.isFinite(part) ? part : 0));

  const left = parse(current);
  const right = parse(minimum);
  const length = Math.max(left.length, right.length);

  for (let index = 0; index < length; index += 1) {
    const a = left[index] ?? 0;
    const b = right[index] ?? 0;

    if (a !== b) {
      return a < b;
    }
  }

  return false;
}
