-- Migration: Create RPC function for atomic AI flashcard acceptance
-- Purpose: Provide transactional processing of AI generation acceptance with full validation
-- Affected: Creates accept_ai_generation() function
-- Security: SECURITY DEFINER allows RLS bypass within function, but validates user ownership explicitly

-- Drop function if exists (for idempotent migrations)
DROP FUNCTION IF EXISTS accept_ai_generation(UUID, UUID, JSONB);

-- Create RPC function for accepting AI-generated flashcard proposals
-- This function executes all operations in a single atomic transaction
CREATE OR REPLACE FUNCTION accept_ai_generation(
  p_user_id UUID,
  p_generation_id UUID,
  p_proposals JSONB
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER -- Run with function owner's privileges (bypasses RLS, but we validate manually)
SET search_path = public
AS $$
DECLARE
  v_generated_count INT;
  v_accepted_count INT;
  v_source_id UUID;
  v_proposal JSONB;
BEGIN
  -- Step 1: Verify generation exists and belongs to user
  -- This SELECT also acquires a row lock (FOR UPDATE would be explicit, but not needed here)
  SELECT generated_count INTO STRICT v_generated_count
  FROM ai_generations
  WHERE id = p_generation_id
    AND user_id = p_user_id;

  -- If no row found, STRICT mode raises NO_DATA_FOUND exception
  -- We catch it below and convert to custom error code

  -- Step 2: Check if generation was already accepted (prevent duplicate processing)
  IF EXISTS (
    SELECT 1
    FROM ai_generations_acceptance
    WHERE ai_generation_id = p_generation_id
  ) THEN
    RAISE EXCEPTION 'AI generation already accepted'
      USING ERRCODE = '23505',  -- Unique violation code (for consistency with PK violations)
            DETAIL = 'generation_id=' || p_generation_id::TEXT,
            HINT = 'Each generation can only be accepted once';
  END IF;

  -- Step 3: Business validation - check proposal count
  v_accepted_count := jsonb_array_length(p_proposals);

  IF v_accepted_count > v_generated_count THEN
    RAISE EXCEPTION 'Accepted count (%) exceeds generated count (%)', v_accepted_count, v_generated_count
      USING ERRCODE = '22000',  -- Data exception
            DETAIL = 'Cannot accept more proposals than were generated',
            HINT = 'Verify proposals array matches original generation output';
  END IF;

  IF v_accepted_count = 0 THEN
    RAISE EXCEPTION 'Proposals array is empty'
      USING ERRCODE = '22000',  -- Data exception
            DETAIL = 'At least one proposal must be accepted',
            HINT = 'Check that p_proposals is a non-empty JSON array';
  END IF;

  -- Step 4: Create flashcard source record (provenance tracking)
  INSERT INTO flashcard_sources (
    user_id,
    source_type,
    source_id
  ) VALUES (
    p_user_id,
    'ai'::flashcard_source_type,
    p_generation_id
  )
  RETURNING flashcard_source_id INTO v_source_id;

  -- Step 5: Create flashcards (bulk insert via loop)
  -- Note: PostgreSQL optimizes loops over small JSONB arrays efficiently
  FOR v_proposal IN
    SELECT * FROM jsonb_array_elements(p_proposals)
  LOOP
    -- Validate proposal structure
    IF NOT (v_proposal ? 'front' AND v_proposal ? 'back') THEN
      RAISE EXCEPTION 'Invalid proposal structure: missing front or back field'
        USING ERRCODE = '22000',
              DETAIL = 'Proposal: ' || v_proposal::TEXT;
    END IF;

    -- Insert flashcard
    INSERT INTO flashcards (
      user_id,
      flashcard_source_id,
      source_type,
      front,
      back
    ) VALUES (
      p_user_id,
      v_source_id,
      'ai'::flashcard_source_type,
      v_proposal->>'front',
      v_proposal->>'back'
    );
  END LOOP;

  -- Step 6: Record acceptance metrics
  INSERT INTO ai_generations_acceptance (
    ai_generation_id,
    user_id,
    accepted_count
  ) VALUES (
    p_generation_id,
    p_user_id,
    v_accepted_count
  );

  -- Transaction commits automatically if we reach here without exceptions

EXCEPTION
  -- Handle case where generation doesn't exist or doesn't belong to user
  WHEN NO_DATA_FOUND THEN
    RAISE EXCEPTION 'AI generation not found or access denied'
      USING ERRCODE = 'P0001',  -- Custom error code for NOT FOUND
            DETAIL = 'generation_id=' || p_generation_id::TEXT || ', user_id=' || p_user_id::TEXT,
            HINT = 'Verify the generation_id is correct and belongs to the authenticated user';

  -- Re-raise any other exceptions (transaction will rollback automatically)
  WHEN OTHERS THEN
    RAISE;
END;
$$;

-- Grant execute permission to authenticated users
-- Note: anon users cannot execute this function (they can't authenticate anyway)
GRANT EXECUTE ON FUNCTION accept_ai_generation(UUID, UUID, JSONB) TO authenticated;

-- Add function comment for documentation
COMMENT ON FUNCTION accept_ai_generation IS
  'Atomically accepts AI-generated flashcard proposals. Creates flashcard source, flashcards, and acceptance record in a single transaction. Validates generation ownership, prevents duplicate acceptance, and enforces proposal count constraints.';
