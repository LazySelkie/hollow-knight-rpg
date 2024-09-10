import { EntitySheetHelper } from "./helper.js";
import {ATTRIBUTE_TYPES} from "./constants.js";
import { addProf, deleteProf } from "./hk.js";

/**
 * Extend the basic ActorSheet with some very simple modifications
 * @extends {ActorSheet}
 */
export class HKActorSheet extends ActorSheet {

  /** @inheritdoc */
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["hollow-knight-rpg", "sheet", "actor"],
      template: "systems/hollow-knight-rpg/templates/actor-sheet.html",
      width: 900,
      height: 600,
      tabs: [{navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "main"}],
      scrollY: [".main", ".biography", ".items", ".attributes"],
      dragDrop: [{dragSelector: ".item-list .item", dropSelector: null}]
    });
  }

  /* -------------------------------------------- */

  /** @inheritdoc */
  async getData(options) {
    const context = await super.getData(options);
    //context.shorthand = !!game.settings.get("hollow-knight-rpg", "macroShorthand");
    context.systemData = context.data.system;
    context.dtypes = ATTRIBUTE_TYPES;
    context.biographyHTML = await TextEditor.enrichHTML(context.systemData.biography, {
      secrets: this.document.isOwner,
      async: true
    });
    // Try this later? And change {{editor}} to biography too
    // context.biography = await TextEditor.enrichHTML(context.systemData.biography, {
    //   secrets: this.document.isOwner,
    //   async: true
    // });
    context.descriptionHTML = await TextEditor.enrichHTML(context.systemData.description, {
      secrets: this.document.isOwner,
      async: true
    });
    context.notesHTML = await TextEditor.enrichHTML(context.systemData.notes, {
      secrets: this.document.isOwner,
      async: true
    });

    this._prepareItems(context);

    return context;
  }

  _prepareItems(sheetData) {
    const actorData = sheetData.actor;

    // Initialize containers
    const traits = [];
    const paths = [];
    const charms = [];
    const equipment = [];
    const techniques = [];
    const weapons_shields = [];
    const armor = [];

    // Iterate through items, allocating to containers
    for (let i of sheetData.items) {
      let item = i.system;
      i.img = i.img || DEFAULT_TOKEN;
      // A bunch of ifs for all item types
      if (i.type === 'trait') {
        traits.push(i);
        //console.log("item ", i)
      }
      else if (i.type === 'path') {
        paths.push(i);
      }
      else if (i.type === 'charm') {
        charms.push(i);
        // if (i.data.spellLevel != undefined) {
        //   spells[i.data.spellLevel].push(i);
        // }
      }
      else if (i.type === 'equipment') {
        equipment.push(i);
      }
      else if (i.type === 'technique') {
        techniques.push(i);
      }
      else if (i.type === 'weapon-shield') {
        weapons_shields.push(i);
      }
      else if (i.type === 'armor') {
        armor.push(i);
      }
    }
    // Assign and return
    actorData.traits = traits;
    actorData.paths = paths;
    actorData.charms = charms;
    actorData.equipment = equipment;
    actorData.techniques = techniques;
    actorData.weapons_shields = weapons_shields;
    actorData.armor = armor;
  }

  /* -------------------------------------------- */

  /** @inheritdoc */
  activateListeners(html) {
    super.activateListeners(html);

    // Everything below here is only needed if the sheet is editable
    if ( !this.isEditable ) return;

    // Item Controls
    html.find(".item-control").click(this._onItemControl.bind(this));
    html.find(".items .rollable").on("click", this._onItemRoll.bind(this));
    html.find(".rollable").click(this._onAttributeRoll.bind(this));

    // Proficiencies show-hide
    html.find(".prof-toggle").click(this._onProfToggle.bind(this));
    // Add proficiency
    html.find(".prof-add").click(this._onProfAdd.bind(this));
    // Delete proficiency
    html.find(".prof-delete").click(this._onProfDelete.bind(this));

    // Add draggable for Macro creation
    html.find(".attributes a.attribute-roll").each((i, a) => {
      a.setAttribute("draggable", true);
      a.addEventListener("dragstart", ev => {
        let dragData = ev.currentTarget.dataset;
        ev.dataTransfer.setData('text/plain', JSON.stringify(dragData));
      }, false);
    });
  }

  /* -------------------------------------------- */

  /**
   * Handle click events for Item control buttons within the Actor Sheet
   * @param event
   * @private
   */
  _onItemControl(event) {
    event.preventDefault();

    // Obtain event data
    const button = event.currentTarget;
    const li = button.closest(".item");
    const item = this.actor.items.get(li?.dataset.itemId);

    // Handle different actions
    switch ( button.dataset.action ) {
      case "create":
        return this._onItemCreate(event)
      case "edit":
        return item.sheet.render(true);
      case "delete":
        return item.delete();
    }
  }

  /**
   * Handle creating a new Owned Item for the actor using initial data defined in the HTML dataset
   * @param {Event} event   The originating click event
   * @private
   */
  async _onItemCreate(event) {
    event.preventDefault();
    const header = event.currentTarget;
    // Get the type of item to create.
    const type = header.dataset.type;
    // Grab any data associated with this control.
    const data = duplicate(header.dataset);
    // Initialize a default name.
    const name = `New ${type.capitalize()}`;
    // Prepare the item object.
    const itemData = {
      name: name,
      type: type,
      system: data
    };
    // Remove the type from the dataset since it's in the itemData.type prop.
    delete itemData.system["type"];

    // Finally, create the item!
    console.log("New Item: ", itemData)
    return await Item.create(itemData, {parent: this.actor});
  }


  /* -------------------------------------------- */

  /**
   * Listen for roll buttons on items.
   * @param {MouseEvent} event    The originating left click event
   */
  _onItemRoll(event) {
    let button = $(event.currentTarget);
    const li = button.parents(".item");
    const item = this.actor.items.get(li.data("itemId"));
    let r = new Roll(button.data('roll'), this.actor.getRollData());
    return r.toMessage({
      user: game.user.id,
      speaker: ChatMessage.getSpeaker({ actor: this.actor }),
      flavor: `<h2>${item.name}</h2><h3>${button.text()}</h3>`
    });
  }

  /* -------------------------------------------- */

  /**
   * Handle click events for rollable attributes within the Actor Sheet
   * @param event
   * @private
   */
  async _onAttributeRoll(event) {
    event.preventDefault();
    const element = event.currentTarget;
    const dataset = element.dataset;

    if (dataset.roll) {
      let roll = await new Roll(`${dataset.roll}cs>=5`, this.actor.system).evaluate();
      let label = dataset.label ? `Rolling ${dataset.label}` : '';
      roll.toMessage({
        speaker: ChatMessage.getSpeaker({ actor: this.actor }),
        flavor: label
      });
    }
  }

  // Toggles visibility of proficiency's skills
  async _onProfToggle(event) {
    const index = event.currentTarget.dataset.id;
    let profs = this.actor.system.proficiencies;
    let exp = !profs[index].expanded;

    this.actor.update({ [`system.proficiencies.${index}.expanded`]: exp });

    // profs[index].expanded = !profs[index]?.expanded;
    console.log("_onProfToggle: ", index, profs)
    // this.actor.sheet.render();

    // const element = event.currentTarget;
    // let skill_list = element.parentElement.nextElementSibling;
    // skill_list.classList.toggle("hidden");
    // element.classList.toggle("fa-arrow-right");
    // element.classList.toggle("fa-arrow-down");
  }

  async _onProfAdd(event) {
    const thisActor = this.actor;
    const newProf = {
      "name": "",
      "rank": 0,
      "skills": {
        "0": {
          "name": "",
          "mastery": false,
          "description": ""
        },
        "1": {
          "name": "",
          "mastery": false,
          "description": ""
        },
        "2": {
          "name": "",
          "mastery": false,
          "description": ""
        },
        "3": {
          "name": "",
          "mastery": false,
          "description": ""
        }}
    }
    addProf(newProf, thisActor);
  }

  async _onProfDelete(event) {
    const thisActor = this.actor;
    const element = event.currentTarget;
    let delIndex = Number(element.dataset.id);
    deleteProf(delIndex, thisActor);
  }
/* -------------------------------------------- */

  /** @inheritdoc */
  _getSubmitData(updateData) {
    let formData = super._getSubmitData(updateData);
    formData = EntitySheetHelper.updateAttributes(formData, this.object);
    return formData;
  }
}
