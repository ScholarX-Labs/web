import { eq } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { dbCompletionCriteria } from "@/domain/certificates/infrastructure/db/certificates-db.schema";
import type { CompletionCriteriaDTO } from "@/domain/certificates/contracts";

type DbClient = PostgresJsDatabase<Record<string, unknown>>;

function mapToDTO(
  row: typeof dbCompletionCriteria.$inferSelect,
): CompletionCriteriaDTO {
  return {
    courseId: row.courseId,
    minWatchPercentage: row.minWatchPercentage,
    quizzesRequired: row.quizzesRequired,
    minQuizScore: row.minQuizScore,
  };
}

export class CompletionCriteriaRepository {
  constructor(private readonly db: DbClient) {}

  async findByCourseId(courseId: string): Promise<CompletionCriteriaDTO | null> {
    const rows = await this.db
      .select()
      .from(dbCompletionCriteria)
      .where(eq(dbCompletionCriteria.courseId, courseId))
      .limit(1);
    return rows[0] ? mapToDTO(rows[0]) : null;
  }

  async upsert(data: {
    courseId: string;
    minWatchPercentage: number;
    quizzesRequired: boolean;
    minQuizScore?: number | null;
  }): Promise<CompletionCriteriaDTO> {
    const rows = await this.db
      .insert(dbCompletionCriteria)
      .values({
        courseId: data.courseId,
        minWatchPercentage: data.minWatchPercentage,
        quizzesRequired: data.quizzesRequired,
        minQuizScore: data.minQuizScore ?? null,
      })
      .onConflictDoUpdate({
        target: dbCompletionCriteria.courseId,
        set: {
          minWatchPercentage: data.minWatchPercentage,
          quizzesRequired: data.quizzesRequired,
          minQuizScore: data.minQuizScore ?? null,
          updatedAt: new Date(),
        },
      })
      .returning();
    if (!rows[0]) throw new Error("Failed to upsert completion criteria");
    return mapToDTO(rows[0]);
  }
}
