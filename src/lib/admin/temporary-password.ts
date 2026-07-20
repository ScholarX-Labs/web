import crypto from "crypto";

export class TemporaryPasswordGenerator {
  private static readonly LOWERCASE = "abcdefghijkmnpqrstuvwxyz";
  private static readonly UPPERCASE = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  private static readonly DIGITS = "23456789";
  private static readonly SPECIAL = "!@#$%^&*";

  static generate(length = 12): string {
    const allChars =
      this.LOWERCASE + this.UPPERCASE + this.DIGITS + this.SPECIAL;

    const required = [
      this.LOWERCASE[this.secureIndex(this.LOWERCASE.length)],
      this.UPPERCASE[this.secureIndex(this.UPPERCASE.length)],
      this.DIGITS[this.secureIndex(this.DIGITS.length)],
      this.SPECIAL[this.secureIndex(this.SPECIAL.length)],
    ];

    const remaining = length - required.length;
    for (let i = 0; i < remaining; i++) {
      required.push(allChars[this.secureIndex(allChars.length)]);
    }

    return this.shuffle(required).join("");
  }

  private static secureIndex(max: number): number {
    const buf = crypto.randomBytes(4);
    return buf.readUInt32BE(0) % max;
  }

  private static shuffle<T>(array: T[]): T[] {
    const result = [...array];
    for (let i = result.length - 1; i > 0; i--) {
      const j = this.secureIndex(i + 1);
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }
}
