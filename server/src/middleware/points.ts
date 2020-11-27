import { Player } from "../models/player.model";
import { ResourceList, MilitaryStats } from "../models/playerData.model";

// --------------------
// POINTS CALCULATION
// --------------------

export function calculatePoints(player: Player): number {
  let points = player.points;
  let coinPoints = Math.floor(player.coins / 3);
  let militaryPoints = calculateMilitaryPoints(player.military);

  let scienceOptions: number = 0;
  if (player.optionalResources) {
    player.optionalResources.forEach((valueArray: [number, string][]) => {
      const resource = valueArray[0][1].toLowerCase();
      if (resource === 'gear' || resource === 'tablet' || resource === 'compass') {
        scienceOptions++;
      }
    });
  }
  let sciencePoints = calculateSciencePoints(player.resources, scienceOptions);

  let total = points + coinPoints + militaryPoints + sciencePoints;
  return total;
}

export function calculateMilitaryPoints(military: MilitaryStats): number {
  const { loss, one, three, five } = military;
  return -1 * (loss) + (one) + 3 * (three) + 5 * (five);
}

export function calculateSciencePoints(resources: ResourceList, options: number): number {
  let sciencePoints = 0;
  const { gear, tablet, compass } = resources;
  sciencePoints += (gear * gear + tablet * tablet + compass * compass);
  sciencePoints += Math.min(gear, tablet, compass) * 7;

  const addGear = { ...resources, gear: gear + 1 };
  const addTablet = { ...resources, tablet: tablet + 1 };
  const addCompass = { ...resources, compass: compass + 1 };
  if (options > 0) {
    sciencePoints = Math.max(
      calculateSciencePoints(addGear, options - 1),
      calculateSciencePoints(addTablet, options - 1),
      calculateSciencePoints(addCompass, options - 1)
    );
  }

  return sciencePoints;
}
