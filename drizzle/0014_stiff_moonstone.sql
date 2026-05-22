DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'email_deliveries_batch_id_email_batches_id_fk'
  ) THEN
    ALTER TABLE "email"."email_deliveries"
      ADD CONSTRAINT "email_deliveries_batch_id_email_batches_id_fk"
      FOREIGN KEY ("batch_id")
      REFERENCES "email"."email_batches"("id")
      ON DELETE SET NULL
      ON UPDATE NO ACTION;
  END IF;
END $$;
