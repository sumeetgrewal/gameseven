import { Player } from "../models/player.model";
import { ResourceList, MilitaryStats, GameScore } from "../models/playerData.model";

// --------------------
// POINTS CALCULATION
// --------------------

export function calculatePoints(player: Player): GameScore {
  const { civilianPoints, stagePoints, guildPoints, commercialPoints } = player;
  let score: GameScore = {
    civilian: civilianPoints,
    commercial: commercialPoints,
    stages: stagePoints,
    guilds: guildPoints,
    coins: Math.floor(player.coins / 3),
    military: calculateMilitary(player.military),
    scientific: calculateScience(player.resources, player.optionalResources),
    total: 0,
  }

  score.total = Object.values(score).reduce((total: number, value: number) => total + value)
  return score;
}

export function calculateMilitary(military: MilitaryStats): number {
  const { loss, one, three, five } = military;
  return -1 * (loss) + (one) + 3 * (three) + 5 * (five);
}

export function calculateScience(resources: ResourceList, optionalResources: any) {
  let scienceOptions: number = 0;
  if (optionalResources) {
    optionalResources.forEach((valueArray: [number, string][]) => {
      const resource = valueArray[0][1].toLowerCase();
      if (resource === 'gear' || resource === 'tablet' || resource === 'compass') {
        scienceOptions++;
      }
    });
  }
  return optimizeScience(resources, scienceOptions)
}

export function optimizeScience(resources: ResourceList, options: number): number {
  let sciencePoints = 0;
  const { gear, tablet, compass } = resources;
  sciencePoints += (gear * gear + tablet * tablet + compass * compass);
  sciencePoints += Math.min(gear, tablet, compass) * 7;

  const addGear = { ...resources, gear: gear + 1 };
  const addTablet = { ...resources, tablet: tablet + 1 };
  const addCompass = { ...resources, compass: compass + 1 };
  if (options > 0) {
    sciencePoints = Math.max(
      optimizeScience(addGear, options - 1),
      optimizeScience(addTablet, options - 1),
      optimizeScience(addCompass, options - 1)
    );
  }

  return sciencePoints;
}
