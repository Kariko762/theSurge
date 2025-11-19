/**
 * Attribute Modifiers (Sci‑Fi equivalents of D&D stats)
 * Expected scale: 0..5 (but any number works). Higher is better.
 *
 * Core Attributes (D&D -> Sci‑Fi):
 * - Strength     -> Kinetics      (force application, manual labor)
 * - Dexterity    -> Reflexes      (hand/eye coordination, reaction)
 * - Constitution -> Resilience    (endurance, damage tolerance)
 * - Intelligence -> Logic         (analysis, computation)
 * - Wisdom       -> Insight       (judgment, situational awareness)
 * - Charisma     -> Presence      (influence, command presence)
 * - Perception   -> Acuity        (sensor acuity + attention to detail)
 *
 * Common Skills (examples):
 * - engineering, scavenging, gunnery, piloting, medicine, survival, hacking
 */

function v(n) { return typeof n === 'number' ? n : 0; }

function getAttr(attrs, key) { return v(attrs?.[key]); }
function getSkill(skills, key) { return v(skills?.[key]); }

/**
 * Convert attribute + skill blend to a simple modifier.
 * We keep it intentionally linear and small to stack cleanly with other sources.
 */
function blend(...nums) {
  // Average then round down; caps keep values modest
  const total = nums.reduce((s, n) => s + v(n), 0);
  const avg = total / Math.max(nums.length, 1);
  return Math.floor(avg); // 0..5 -> 0..5
}

export function getAttributeModifiers(actionType, context) {
  const attrs = context.attributes || {};     // core attributes
  const skills = context.skills || {};        // optional skill set
  let modifier = 0;

  switch (actionType) {
    case 'mining':
      modifier += blend(
        getAttr(attrs, 'logic') + 1,            // analysis/planning
        getSkill(skills, 'engineering') + 1,    // tool handling
        getAttr(attrs, 'resilience')            // tolerance for risk/heat
      );
      break;

    case 'scavenging':
      modifier += blend(
        getAttr(attrs, 'acuity') + 1,           // spotting valuable items
        getAttr(attrs, 'insight'),              // intuition about containers
        getSkill(skills, 'scavenging') + 1
      );
      break;

    case 'derelict':
      modifier += blend(
        getAttr(attrs, 'insight') + 1,          // structural intuition
        getAttr(attrs, 'logic'),                 // systematic investigation
        getSkill(skills, 'engineering'),
        getSkill(skills, 'hacking')
      );
      break;

    case 'awayTeam':
      modifier += blend(
        getAttr(attrs, 'resilience') + 1,       // endurance
        getAttr(attrs, 'insight'),
        getSkill(skills, 'survival') + 1,
        getSkill(skills, 'medicine')
      );
      break;

    case 'combatInitiate':
      modifier += blend(
        getAttr(attrs, 'reflexes') + 1,
        getAttr(attrs, 'insight'),
        getSkill(skills, 'piloting')
      );
      break;

    case 'combatAttack':
      modifier += blend(
        getAttr(attrs, 'reflexes') + 1,
        getSkill(skills, 'gunnery') + 1,
        getSkill(skills, 'piloting')            // firing solutions while maneuvering
      );
      break;

    case 'combatFlee':
      modifier += blend(
        getSkill(skills, 'piloting') + 1,
        getAttr(attrs, 'reflexes'),
        getAttr(attrs, 'resilience')
      );
      break;

    case 'combatRepair':
      modifier += blend(
        getSkill(skills, 'engineering') + 1,
        getAttr(attrs, 'logic') + 1,
        getAttr(attrs, 'kinetics')              // manual force when needed
      );
      break;

    case 'missionCompletion':
      modifier += blend(
        getAttr(attrs, 'presence'),
        getAttr(attrs, 'insight'),
        getAttr(attrs, 'logic')
      );
      break;

    default:
      break;
  }

  return modifier;
}
