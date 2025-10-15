---
description: Implement REST API endpoint based on implementation plan
argument-hint: <implementation-plan-file>
---

# Implement REST API Endpoint

Implements a REST API endpoint following the project's architecture patterns and implementation rulebook.

## Usage

```bash
/implement-rest-api @.ai/ai-generation-implementation-plan.md
```

## How it works

This command uses the implementation rulebook methodology to generate production-ready code for a REST API endpoint. It follows these principles:

1. **Type Safety**: Uses DTOs from `lib/dto/types.ts`
2. **Architecture**: Follows patterns from `.claude/rules/core.md` and `.claude/rules/nextjs-backend.md`
3. **Incremental**: Implements max 3 steps at a time, waits for feedback
4. **Comprehensive**: Includes validation, error handling, services, and route handlers

## Implementation Prompt

@.claude/commands/prompts/implement-rest-api.md
