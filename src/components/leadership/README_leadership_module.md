# Leadership Development Module

## Overview

A scalable, multi-church, member-linked leadership tracking system, fully integrated with spiritual growth (milestones, mentorship, and training).

## Database Model

- **leadership_roles**: assigns members as leaders (role, active status).
- **leadership_promotions**: tracks member promotions and role changes.
- **leadership_evaluations**: stores self/peer/supervisor evaluations with multi-factor and JSON qualities.
- **leadership_alerts**: auto-generated alerts for inactivity, burnout, readiness, etc.
- **leadership_milestone_templates** and **leadership_milestone_records**: leadership milestone tracking (e.g. leader orientation).
- **leadership_exit_records**: tracks leader exits, interviews, and reasons.

## Integration

- All leadership tables link to members via `member_id`.
- **Mentorship assignments**: Use the `mentorship_assignments` table (from spiritual growth module) to link mentor (leader) and mentee.
- **Promotion**: Evaluate via spiritual milestones and foundation school enrollment, then add to `leadership_roles`.
- **Milestones**: Track leadership-specific milestones (orientation, training) in parallel with spiritual milestones.

## API Layer

- CRUD endpoints for roles, promotions, evaluations, alerts, milestones, and exits.
- Promotion endpoint checks eligibility using spiritual growth tables.

## Usage Workflow

1. **Promotion**: When a member meets milestone and training requirements, add to `leadership_roles`.
2. **Mentorship**: Use `mentorship_assignments` table for mentor/mentee relationships.
3. **Evaluation**: Record leadership evaluations using multiple factors.
4. **Alerts**: System auto-generates alerts for inactivity, burnout, readiness.
5. **Milestones**: Track completion of leadership-specific milestones.
6. **Exit**: Record reasons and interviews for leadership exits.

## Extensibility

- Multi-church, multi-role support.
- Easily connects with spiritual growth, cell ministry, and discipleship modules.
- Add new milestone templates, evaluation factors, or alert types as needed.

## Example Promotion Flow

- Member completes all required spiritual milestones (`milestone_records` + `milestone_templates`).
- Member completes Foundation School (`foundation_school_enrollments`).
- System promotes member: adds to `leadership_roles`.
- Assign mentorship (use `mentorship_assignments` for mentor/mentee).
- Track leader performance, milestones, and generate alerts as needed.

---