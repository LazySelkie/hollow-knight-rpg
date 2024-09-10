/**
 * A simple system by LazySelkie for Hollow Knight RPG, based on Simple Worldbuilding System by Atropos
 */

// Import Modules
import { HKActor } from "./actor.js";
import { HKItem } from "./item.js";
import { HKItemSheet } from "./item-sheet.js";
import { HKActorSheet } from "./actor-sheet.js";
import { preloadHandlebarsTemplates } from "./templates.js";
import { createWorldbuildingMacro } from "./macro.js";
import { HKToken, HKTokenDocument } from "./token.js";

/* -------------------------------------------- */
/*  Foundry VTT Initialization                  */
/* -------------------------------------------- */

/**
 * Init hook.
 */
Hooks.once("init", async function() {
  console.log(`Initializing Hollow Knight RPG System`);

  /**
   * Set an initiative formula for the system
   * @type {String}
   */
  CONFIG.Combat.initiative = {
    formula: "(@attributes.grace.value)d6",
    decimals: 2
  };

  game.hkrpg = {
    HKActor,
    createWorldbuildingMacro
  }

  // Define custom Document classes
  CONFIG.Actor.documentClass = HKActor;
  CONFIG.Item.documentClass = HKItem;
  CONFIG.Token.documentClass = HKTokenDocument;
  CONFIG.Token.objectClass = HKToken;

  // Register sheet application classes
  Actors.unregisterSheet("core", ActorSheet);
  Actors.registerSheet("hollow-knight-rpg", HKActorSheet, { makeDefault: true });
  Items.unregisterSheet("core", ItemSheet);
  Items.registerSheet("hollow-knight-rpg", HKItemSheet, { makeDefault: true });

  // Register system settings
  game.settings.register("hollow-knight-rpg", "allow0ArcanaForAll", {
    name: game.i18n.localize("settings.allow0ArcanaForAll.name"),
    hint: game.i18n.localize("settings.allow0ArcanaForAll.hint"),
    scope: "world",
    type: Boolean,
    default: true,
    config: true
  });
  game.settings.register("hollow-knight-rpg", "countLightWeight", {
    name: game.i18n.localize("settings.countLightWeight.name"),
    hint: game.i18n.localize("settings.countLightWeight.hint"),
    scope: "world",
    type: Boolean,
    default: false,
    config: true
  });
  // Here are 2 examples for registering system setting
  // game.settings.register("hollow-knight-rpg", "macroShorthand", {
  //   name: "SETTINGS.HKMacroShorthandN",
  //   hint: "SETTINGS.HKMacroShorthandL",
  //   scope: "world",
  //   type: Boolean,
  //   default: true,
  //   config: true
  // });
  // Register initiative setting.
  // game.settings.register("hollow-knight-rpg", "initFormula", {
  //   name: "SETTINGS.HKInitFormulaN",
  //   hint: "SETTINGS.HKInitFormulaL",
  //   scope: "world",
  //   type: String,
  //   default: "(@attributes.grace.value)d6",
  //   config: true,
  //   onChange: formula => _simpleUpdateInit(formula, true)
  // });

  /**
   * Slugify a string.
   */
  Handlebars.registerHelper('slugify', function(value) {
    return value.slugify({strict: true});
  });

  // Handlebar for repeating something n times
  Handlebars.registerHelper("times", function (n, content) {
    let result = "";
    for (let i = 0; i < n; ++i) {
      content.data.index = i + 1;
      result += content.fn(i);
    }

    return result;
  });

  // Preload template partials
  await preloadHandlebarsTemplates();
});

/**
 * Macrobar hook.
 */
Hooks.on("hotbarDrop", (bar, data, slot) => createWorldbuildingMacro(data, slot));

/**
 * Adds the actor template context menu.
 */
// Here goes "right mouse click on actor" stuff
// Пока оставляю как пример добавления чего-то в меню на пкм
Hooks.on("getActorDirectoryEntryContext", (html, options) => {

  // options.push({
  //   name: game.i18n.localize("SIMPLE.DefineTemplate"),
  //   icon: '<i class="fas fa-stamp"></i>',
  //   condition: li => {
  //     const actor = game.actors.get(li.data("documentId"));
  //     return !actor.isTemplate;
  //   },
  //   callback: li => {
  //     const actor = game.actors.get(li.data("documentId"));
  //     actor.setFlag("hollow-knight-rpg", "isTemplate", true);
  //   }
  // });
});

/* --------------------------------------------- */
// Proficiencies stuff

function addProf(newProf, thisActor) {
  const profs = foundry.utils.deepClone(thisActor.system.proficiencies);
  const index = Object.keys(profs).length;
  profs[index] = newProf;
  thisActor.update({ 'system.proficiencies': profs });
}

function deleteProf(delIndex, thisActor) {
  const profs = foundry.utils.deepClone(thisActor.system.proficiencies);
  let profsAmount = Object.keys(profs).length;
  const updates = {};
  for (let i = delIndex; i < profsAmount - 1; i++) {
    updates[`system.proficiencies.${i}`] = profs[i+1];
  }
  updates[`system.proficiencies.-=${profsAmount - 1}`] = null;
  thisActor.update(updates);
}

export { addProf, deleteProf };