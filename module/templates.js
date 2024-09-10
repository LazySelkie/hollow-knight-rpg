/**
 * Define a set of template paths to pre-load
 * Pre-loaded templates are compiled and cached for fast access when rendering
 * @return {Promise}
 */
export const preloadHandlebarsTemplates = async function() {

  // Define template paths to load
  const templatePaths = [
    // Different items
    "systems/hollow-knight-rpg/templates/parts/item-sheet-path.html",
    "systems/hollow-knight-rpg/templates/parts/item-sheet-trait.html",
    "systems/hollow-knight-rpg/templates/parts/item-sheet-charm.html",
    "systems/hollow-knight-rpg/templates/parts/item-sheet-equipment.html",
    "systems/hollow-knight-rpg/templates/parts/item-sheet-technique.html",
    "systems/hollow-knight-rpg/templates/parts/item-sheet-weapon-shield.html",
    "systems/hollow-knight-rpg/templates/parts/item-sheet-armor.html"
  ];

  // Load the template parts
  return loadTemplates(templatePaths);
};